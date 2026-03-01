import { useEffect, useState } from "react";
import { Container, Title, Grid, Paper, Text, RingProgress, Group, Loader, Center, ThemeIcon } from "@mantine/core";
import { IconBriefcase, IconTrophy, IconCalendar, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import api from "../api";
import Navbar from "../components/Navbar";

interface Analytics {
    total_applications: number;
    status_breakdown: { status: string; count: number }[];
    analytics: {
        offer_rate: number;
        rejection_rate: number;
        interview_rate: number;
        total_offers: number;
        interview_count: number;
    };
}

const STATUS_COLORS: Record<string, string> = {
    APPLIED: 'blue',
    INTERVIEW: 'cyan',
    OFFER: 'green',
    REJECTED: 'red',
    GHOSTED: 'gray',
    REPLIED: 'yellow',
};

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
    return (
        <Paper withBorder p="lg" radius="md">
            <Group justify="space-between">
                <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
                    <Text size="2rem" fw={700} mt={4}>{value}</Text>
                </div>
                <ThemeIcon size="xl" radius="md" color={color} variant="light">
                    {icon}
                </ThemeIcon>
            </Group>
        </Paper>
    );
}

export default function Analytics() {
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('jobs/stats/');
                setData(response.data);
            } catch {
                notifications.show({ title: 'Error', message: 'Failed to load analytics', color: 'red' });
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <>
            <Navbar />
            <Container mt="xl"><Center><Loader /></Center></Container>
        </>
    );

    if (!data) return null;

    const ringData = data.status_breakdown.map(s => ({
        value: data.total_applications > 0 ? Math.round((s.count / data.total_applications) * 100) : 0,
        color: STATUS_COLORS[s.status] || 'gray',
        tooltip: `${s.status}: ${s.count}`,
    }));

    return (
        <>
            <Navbar />
            <Container size="lg" my={40}>
                <Title order={2} mb="xl">Analytics</Title>

                {/* Stat Cards */}
                <Grid mb="xl">
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <StatCard label="Total Applications" value={data.total_applications} icon={<IconBriefcase size={20} />} color="blue" />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <StatCard label="Interviews" value={data.analytics.interview_count} icon={<IconCalendar size={20} />} color="cyan" />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <StatCard label="Offers" value={data.analytics.total_offers} icon={<IconTrophy size={20} />} color="green" />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <StatCard label="Rejection Rate" value={`${data.analytics.rejection_rate}%`} icon={<IconX size={20} />} color="red" />
                    </Grid.Col>
                </Grid>

                <Grid>
                    {/* Ring Chart */}
                    <Grid.Col span={{ base: 12, md: 5 }}>
                        <Paper withBorder p="lg" radius="md" h="100%">
                            <Title order={4} mb="lg">Application Breakdown</Title>
                            {data.total_applications === 0 ? (
                                <Text c="dimmed" ta="center" py="xl">No applications yet.</Text>
                            ) : (
                                <Center>
                                    <div>
                                        <RingProgress
                                            size={200}
                                            thickness={24}
                                            sections={ringData}
                                            label={
                                                <Text ta="center" size="xs" c="dimmed">
                                                    {data.total_applications} total
                                                </Text>
                                            }
                                        />
                                        <Group justify="center" gap="xs" mt="md" wrap="wrap">
                                            {data.status_breakdown.map(s => (
                                                <Group key={s.status} gap={4}>
                                                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: `var(--mantine-color-${STATUS_COLORS[s.status] || 'gray'}-6)` }} />
                                                    <Text size="xs">{s.status} ({s.count})</Text>
                                                </Group>
                                            ))}
                                        </Group>
                                    </div>
                                </Center>
                            )}
                        </Paper>
                    </Grid.Col>

                    {/* Rates */}
                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <Paper withBorder p="lg" radius="md" h="100%">
                            <Title order={4} mb="lg">Conversion Rates</Title>
                            {[
                                { label: 'Interview Rate', value: data.analytics.interview_rate, color: 'cyan' },
                                { label: 'Offer Rate', value: data.analytics.offer_rate, color: 'green' },
                                { label: 'Rejection Rate', value: data.analytics.rejection_rate, color: 'red' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ marginBottom: 20 }}>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm">{label}</Text>
                                        <Text size="sm" fw={600}>{value}%</Text>
                                    </Group>
                                    <div style={{ height: 8, backgroundColor: '#f1f3f5', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${value}%`, backgroundColor: `var(--mantine-color-${color}-6)`, borderRadius: 4, transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            ))}
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Container>
        </>
    );
}
