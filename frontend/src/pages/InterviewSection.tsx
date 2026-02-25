import { useEffect, useState } from "react";
import { Paper, Title, Button, Group, Text, Timeline, TextInput, Textarea, Select, ActionIcon } from "@mantine/core";
import { IconCalendar, IconCheck, IconTrash } from "@tabler/icons-react";
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
    { value: 'HR', label: 'HR' },
    { value: 'BEHAVIOURAL', label: 'Behavioural' },
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'MANAGERIAL', label: 'Managerial' },
    { value: 'GD', label: 'Group Discussion' },
    { value: 'OTHERS', label: 'Others' },
];

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
            <Paper withBorder p="md" radius="md" mt="xl">
                <Group justify="space-between" mb="lg">
                    <Title order={4}>Interview Timeline</Title>
                    <Button size="xs" leftSection={<IconCalendar size={14} />} onClick={() => setOpened(true)}>
                        Schedule Round
                    </Button>
                </Group>

                {interviews.length === 0 ? (
                    <Text c="dimmed" size="sm" ta="center" py="lg">No interviews scheduled yet.</Text>
                ) : (
                    <Timeline active={interviews.length} bulletSize={24} lineWidth={2}>
                        {interviews.map((interview) => (
                            <Timeline.Item
                                key={interview.id}
                                bullet={<IconCheck size={12} />}
                                title={interview.type}
                            >
                                <Group justify="space-between">
                                    <div>
                                        <Text c="dimmed" size="sm">
                                            {new Date(interview.interview_at).toLocaleString()}
                                        </Text>
                                        <Text size="xs" mt={4}>With: {interview.interview_with}</Text>
                                        {interview.meeting_link && (
                                            <Text size="xs" mt={2}>
                                                <a href={interview.meeting_link} target="_blank" rel="noreferrer">Join Link</a>
                                            </Text>
                                        )}
                                        {interview.feedback && (
                                            <Text size="xs" mt={4} c="dimmed" fs="italic">"{interview.feedback}"</Text>
                                        )}
                                    </div>
                                    <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleDelete(interview.id)}>
                                        <IconTrash size={14} />
                                    </ActionIcon>
                                </Group>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                )}
            </Paper>

            {/* Plain HTML modal - bypasses Mantine CSS issues */}
            {opened && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, width: '100%', maxWidth: 500, margin: '0 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                        <Group justify="space-between" mb="md">
                            <Text fw={600} size="lg">Schedule Interview Round</Text>
                            <Button variant="subtle" size="xs" onClick={() => setOpened(false)}>✕</Button>
                        </Group>
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Select
                                label="Interview Type"
                                data={INTERVIEW_TYPES}
                                required
                                mb="sm"
                                {...form.getInputProps('type')}
                            />
                            <TextInput type="datetime-local" label="Date & Time" required mb="sm" {...form.getInputProps('interview_at')} />
                            <TextInput label="Interviewer Name" placeholder="e.g. John Smith" mb="sm" {...form.getInputProps('interview_with')} />
                            <TextInput label="Meeting Link" placeholder="https://zoom.us/..." mb="sm" {...form.getInputProps('meeting_link')} />
                            <Textarea label="Notes / Feedback" placeholder="Prep notes, topics to cover..." mb="xl" {...form.getInputProps('feedback')} />
                            <Button fullWidth type="submit">Schedule</Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
