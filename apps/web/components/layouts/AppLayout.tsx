"use client";

import {
  AppShell,
  Group,
  Title,
  NavLink,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";
import { IconLayoutDashboard, IconDrone, IconPlane } from "@tabler/icons-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: IconLayoutDashboard },
  { label: "Drones", href: "/drones", icon: IconDrone },
  { label: "Missions", href: "/missions", icon: IconPlane },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <ThemeIcon variant="light" size="lg" radius="md">
            <IconDrone size={20} />
          </ThemeIcon>
          <Title order={4}>SkyOps Mission Control</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <NavLink
              key={item.href}
              label={item.label}
              leftSection={<item.icon size={18} />}
              active={active}
              onClick={() => router.push(item.href)}
              mb={4}
            />
          );
        })}
        <Text size="xs" c="dimmed" mt="auto" pt="xl">
          Fleet management
        </Text>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
