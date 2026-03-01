import { useEffect, useState } from "react";
import { Paper, Title, Button, Group, Text, Timeline, TextInput, Textarea, Select, ActionIcon, Modal, Badge, ThemeIcon, Divider } from "@mantine/core";
import { IconCalendar, IconCheck, IconTrash, IconVideo, IconLink, IconUser } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import api from "../api";

interface Interview {
    id: number;
    interview_at: string;
    meeting_link: string;
    interview_with: string;
    type: string;
    feedback: string;
    job: number;
}

const INTERVIEW_TYPES = [
    { value: 'HR', label: 'HR Screen' },
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'BEHAVIOURAL', label: 'Behavioural' },
    { value: 'MANAGERIAL', label: 'Managerial' },
    { value: 'GD', label: 'Group Discussion' },
    { value: 'OTHERS', label: 'Others' },
];

const TYPE_COLORS: Record<string, string> = {
    HR: 'blue',
    TECHNICAL: 'violet',
    BEHAVIOURAL: 'cyan',
    MANAGERIAL: 'orange',
    GD: 'teal',
    OTHERS: 'gray',
};

export default function InterviewsSection({ jobId }: { jobId: string }) {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [opened, setOpened] = useState(false);

    const form = useForm({
        initialValues: {
            type: 'HR',
            interview_at: '',
            meeting_link: '',
            interview_with: '',
            feedback: '',
        },
    });

    const fetchInterviews = async () => {
        try {
            const response = await api.get('jobs/interviews/');
            const jobInterviews = response.data.filter((i: any) => i.job === Number(jobId));
            setInterviews(jobInterviews);
        } catch (error) {
            console.error('Failed to load interviews', error);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, [jobId]);

    const handleSubmit = async (values: typeof form.values) => {
        try {
            await api.post('jobs/interviews/', {
                job: Number(jobId),
                interview_at: new Date(values.interview_at).toISOString(),
                meeting_link: values.meeting_link || 'https://placeholder.com',
                interview_with: values.interview_with || 'TBD',
                type: values.type,
                feedback: values.feedback || '',
            });
            notifications.show({ title: 'Scheduled', message: 'Interview added', color: 'green' });
            setOpened(false);
            form.reset();
            fetchInterviews();
        } catch (error: any) {
            console.error('Submit error:', error.response?.data);
            notifications.show({ title: 'Error', message: JSON.stringify(error.response?.data), color: 'red' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this interview?')) return;
        try {
            await api.delete(`jobs/interviews/${id}/`);
            setInterviews(prev => prev.filter(i => i.id !== id));
            notifications.show({ title: 'Deleted', message: 'Interview removed', color: 'gray' });
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Failed to delete', color: 'red' });
        }
    };

    return (
        <>
            <Paper withBorder p="lg" radius="md" mt="xl">
                <Group justify="space-between" mb="lg">
                    <Title order={4}>Interview Timeline</Title>
                    <Button size="xs" leftSection={<IconCalendar size={14} />} onClick={() => setOpened(true)}>
                        Schedule Round
                    </Button>
                </Group>

                {interviews.length === 0 ? (
                    <Text c="dimmed" size="sm" ta="center" py="xl">No interviews scheduled yet.</Text>
                ) : (
                    <Timeline active={interviews.length} bulletSize={28} lineWidth={2}>
                        {interviews.map((interview) => (
                            <Timeline.Item
                                key={interview.id}
                                bullet={
                                    <ThemeIcon size={28} radius="xl" color={TYPE_COLORS[interview.type] || 'gray'} variant="filled">
                                        <IconCheck size={14} />
                                    </ThemeIcon>
                                }
                                title={
                                    <Group gap="xs">
                                        <Badge color={TYPE_COLORS[interview.type] || 'gray'} variant="light" size="sm">
                                            {INTERVIEW_TYPES.find(t => t.value === interview.type)?.label || interview.type}
                                        </Badge>
                                    </Group>
                                }
                            >
                                <Paper withBorder p="sm" radius="sm" mt="xs" mb="sm">
                                    <Group justify="space-between" wrap="nowrap">
                                        <div style={{ flex: 1 }}>
                                            <Group gap="lg" mb={4}>
                                                <Group gap={4}>
                                                    <IconCalendar size={13} color="gray" />
                                                    <Text size="xs" c="dimmed">
                                                        {new Date(interview.interview_at).toLocaleDateString('en-GB', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric'
                                                        })}{' '}
                                                        {new Date(interview.interview_at).toLocaleTimeString('en-GB', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </Text>
                                                </Group>
                                                {interview.interview_with && interview.interview_with !== 'TBD' && (
                                                    <Group gap={4}>
                                                        <IconUser size={13} color="gray" />
                                                        <Text size="xs" c="dimmed">{interview.interview_with}</Text>
                                                    </Group>
                                                )}
                                            </Group>
                                            {interview.meeting_link && !interview.meeting_link.includes('placeholder') && (
                                                <Group gap={4} mb={4}>
                                                    <IconVideo size={13} color="gray" />
                                                    <Text size="xs">
                                                        <a href={interview.meeting_link} target="_blank" rel="noreferrer"
                                                            style={{ color: 'var(--mantine-color-blue-6)', textDecoration: 'none' }}>
                                                            Join Meeting
                                                        </a>
                                                    </Text>
                                                </Group>
                                            )}
                                            {interview.feedback && (
                                                <Text size="xs" c="dimmed" fs="italic" mt={4}>" {interview.feedback} "</Text>
                                            )}
                                        </div>
                                        <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleDelete(interview.id)}>
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Paper>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                )}
            </Paper>

            <Modal opened={opened} onClose={() => { setOpened(false); form.reset(); }} title="Schedule Interview Round" centered size="md">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Select
                        label="Interview Type"
                        data={INTERVIEW_TYPES}
                        required
                        mb="sm"
                        {...form.getInputProps('type')}
                    />
                    <TextInput type="datetime-local" label="Date & Time" required mb="sm" {...form.getInputProps('interview_at')} />
                    <TextInput label="Interviewer Name" placeholder="e.g. John Smith" leftSection={<IconUser size={15}/>} mb="sm" {...form.getInputProps('interview_with')} />
                    <TextInput label="Meeting Link" placeholder="https://zoom.us/..." leftSection={<IconLink size={15}/>} mb="sm" {...form.getInputProps('meeting_link')} />
                    <Divider my="sm" />
                    <Textarea label="Notes / Feedback" placeholder="Prep notes, topics to cover, or post-interview feedback..." minRows={3} mb="lg" {...form.getInputProps('feedback')} />
                    <Button fullWidth type="submit">Schedule Interview</Button>
                </form>
            </Modal>
        </>
    );
}
