import { MissionStatus } from '@skyops/shared';
import { MissionStateMachine } from './mission-state-machine';
import { InvalidMissionTransitionError } from './mission-state-machine.errors';

describe('MissionStateMachine', () => {
  const sm = new MissionStateMachine();

  describe('canTransition', () => {
    it('allows PLANNED to PRE_FLIGHT_CHECK', () => {
      expect(
        sm.canTransition(MissionStatus.PLANNED, MissionStatus.PRE_FLIGHT_CHECK),
      ).toBe(true);
    });
    it('allows PRE_FLIGHT_CHECK to IN_PROGRESS', () => {
      expect(
        sm.canTransition(
          MissionStatus.PRE_FLIGHT_CHECK,
          MissionStatus.IN_PROGRESS,
        ),
      ).toBe(true);
    });

    it('allows IN_PROGRESS to COMPLETED', () => {
      expect(
        sm.canTransition(MissionStatus.IN_PROGRESS, MissionStatus.COMPLETED),
      ).toBe(true);
    });

    it('allows PLANNED to ABORTED', () => {
      expect(
        sm.canTransition(MissionStatus.PLANNED, MissionStatus.ABORTED),
      ).toBe(true);
    });

    it('allows PRE_FLIGHT_CHECK to ABORTED', () => {
      expect(
        sm.canTransition(MissionStatus.PRE_FLIGHT_CHECK, MissionStatus.ABORTED),
      ).toBe(true);
    });

    it('allows IN_PROGRESS to ABORTED', () => {
      expect(
        sm.canTransition(MissionStatus.IN_PROGRESS, MissionStatus.ABORTED),
      ).toBe(true);
    });

    it('rejects skipping a step (PLANNED to IN_PROGRESS)', () => {
      expect(
        sm.canTransition(MissionStatus.PLANNED, MissionStatus.IN_PROGRESS),
      ).toBe(false);
    });

    it('rejects skipping to COMPLETED', () => {
      expect(
        sm.canTransition(MissionStatus.PLANNED, MissionStatus.COMPLETED),
      ).toBe(false);
    });

    it('rejects transitions out of COMPLETED (terminal)', () => {
      expect(
        sm.canTransition(MissionStatus.COMPLETED, MissionStatus.ABORTED),
      ).toBe(false);
    });

    it('rejects transitions out of ABORTED (terminal)', () => {
      expect(
        sm.canTransition(MissionStatus.ABORTED, MissionStatus.IN_PROGRESS),
      ).toBe(false);
    });

    it('rejects going backwards (IN_PROGRESS to PLANNED)', () => {
      expect(
        sm.canTransition(MissionStatus.IN_PROGRESS, MissionStatus.PLANNED),
      ).toBe(false);
    });

    it('rejects a no-op transition to the same status', () => {
      expect(
        sm.canTransition(MissionStatus.PLANNED, MissionStatus.PLANNED),
      ).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it('does not throw for a valid transition', () => {
      expect(() =>
        sm.assertTransition(
          MissionStatus.PLANNED,
          MissionStatus.PRE_FLIGHT_CHECK,
        ),
      ).not.toThrow();
    });

    it('throws InvalidMissionTransitionError for an invalid transition', () => {
      expect(() =>
        sm.assertTransition(MissionStatus.PLANNED, MissionStatus.COMPLETED),
      ).toThrow(InvalidMissionTransitionError);
    });
  });

  describe('allowedTransitions', () => {
    it('lists valid next states for PLANNED', () => {
      expect(sm.allowedTransitions(MissionStatus.PLANNED)).toEqual(
        expect.arrayContaining([
          MissionStatus.PRE_FLIGHT_CHECK,
          MissionStatus.ABORTED,
        ]),
      );
    });

    it('returns an empty list for a terminal state', () => {
      expect(sm.allowedTransitions(MissionStatus.COMPLETED)).toEqual([]);
    });
  });
});
