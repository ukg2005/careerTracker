import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Container, Text, Paper, Group, Button, Grid, TextInput,
    Select, Textarea, ActionIcon, Loader, Badge, Avatar,
    Divider, ThemeIcon, Stack, Center
} from "@mantine/core";
import {
    IconArrowLeft, IconExternalLink, IconMapPin, IconCurrencyRupee,
    IconCalendar, IconUser, IconLink, IconBriefcase, IconClock
} from '@tabler/icons-react';
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import api from "../api";
import { Autocomplete } from "@mantine/core";
import DocumentsSection from "./DocumentSection";
import InterviewsSection from "./InterviewSection";
import Navbar from "../components/Navbar";

const STATUS_COLORS: Record<string, string> = {
    APPLIED: 'blue', INTERVIEW: 'cyan', OFFER: 'green',
    REJECTED: 'red', GHOSTED: 'gray', REPLIED: 'yellow',
};

const CONFIDENCE_COLORS: Record<string, string> = {
    HIGH: 'green', MEDIUM: 'yellow', LOW: 'red',
};

export default function JobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState<any>(null);

    const form = useForm({
        initialValues: {
            company: '', job_title: '', status: '', location: '',
            application_link: '', notes: '', confidence: '',
            salary_est: '', source: '', role_type: '', duration: '', contacts: '',
        },
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await api.get(`jobs/${id}/`);
                setJob(response.data);
                form.setValues({
                    company: response.data.company,
                    job_title: response.data.job_title,
                    status: response.data.status,
                    location: response.data.location || '',
                    application_link: response.data.application_link || '',
                    notes: response.data.notes || '',
                    contacts: response.data.contacts || '',
                    confidence: response.data.confidence || '',
                    salary_est: response.data.salary_est != null ? String(response.data.salary_est) : '',
                    source: response.data.source || '',
                    role_type: response.data.role_type || '',
                    duration: response.data.duration || '',
                });
            } catch {
                notifications.show({ title: 'Error', message: 'Job not found', color: 'red' });
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    const handleUpdate = async (values: typeof form.values) => {
        try {
            const payload = {
                ...values,
                salary_est: values.salary_est === '' ? null : Number(values.salary_est),
            };
            await api.patch(`jobs/${id}/`, payload);
            notifications.show({ title: 'Saved', message: 'Job updated', color: 'green' });
        } catch (error: any) {
            console.error('Update error:', error.response?.data);
            notifications.show({ title: 'Error', message: 'Failed to update', color: 'red' });
        }
    };

    if (loading) return <><Navbar /><Container mt='xl'><Center style={{ height: '60vh' }}><Loader size='xl' /></Center></Container></>;

    const companyInitial = form.values.company?.[0]?.toUpperCase() || '?';

    return (
    <>
        <Navbar />
        <Container size="lg" my={32}>
            <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate('/dashboard')}
                mb="lg"
                px={0}
            >
                Back to Dashboard
            </Button>

            <form onSubmit={form.onSubmit(handleUpdate)}>
                {/* ── Hero Header ── */}
                <Paper withBorder radius="md" p="xl" mb="md"
                    style={{ borderLeft: `4px solid var(--mantine-color-${STATUS_COLORS[form.values.status] || 'blue'}-6)` }}>
                    <Group justify="space-between" wrap="nowrap" align="flex-start">
                        <Group gap="lg" wrap="nowrap">
                            <Avatar size={64} radius="md" color={STATUS_COLORS[form.values.status] || 'blue'} variant="filled">
                                {companyInitial}
                            </Avatar>
                            <div>
                                <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={2}>{form.values.role_type || 'Role'}</Text>
                                <Text size="1.6rem" fw={800} lh={1.2}>{form.values.company || '—'}</Text>
                                <Text size="lg" c="dimmed">{form.values.job_title || '—'}</Text>
                                <Group gap="xs" mt="xs">
                                    <Badge color={STATUS_COLORS[form.values.status] || 'gray'} variant="light" size="md">
                                        {form.values.status || 'No Status'}
                                    </Badge>
                                    {form.values.confidence && (
                                        <Badge color={CONFIDENCE_COLORS[form.values.confidence] || 'gray'} variant="outline" size="md">
                                            {form.values.confidence} Confidence
                                        </Badge>
                                    )}
                                </Group>
                            </div>
                        </Group>

                        <Stack gap="xs" align="flex-end">
                            <Button size="sm" type="submit">Save Changes</Button>
                            {form.values.application_link && (
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconExternalLink size={14} />}
                                    onClick={() => window.open(form.values.application_link, '_blank')}
                                >
                                    View Job
                                </Button>
                            )}
                        </Stack>
                    </Group>

                    {/* Quick stats row */}
                    <Divider my="md" />
                    <Group gap="xl">
                        {form.values.location && (
                            <Group gap={6}>
                                <ThemeIcon size="sm" variant="transparent" c="dimmed"><IconMapPin size={14} /></ThemeIcon>
                                <Text size="sm" c="dimmed">{form.values.location}</Text>
                            </Group>
                        )}
                        {form.values.salary_est && (
                            <Group gap={6}>
                                <ThemeIcon size="sm" variant="transparent" c="dimmed"><IconCurrencyRupee size={14} /></ThemeIcon>
                                <Text size="sm" c="dimmed">₹{Number(form.values.salary_est).toLocaleString()}</Text>
                            </Group>
                        )}
                        {form.values.duration && (
                            <Group gap={6}>
                                <ThemeIcon size="sm" variant="transparent" c="dimmed"><IconClock size={14} /></ThemeIcon>
                                <Text size="sm" c="dimmed">{form.values.duration}</Text>
                            </Group>
                        )}
                        {job?.applied_at && (
                            <Group gap={6}>
                                <ThemeIcon size="sm" variant="transparent" c="dimmed"><IconCalendar size={14} /></ThemeIcon>
                                <Text size="sm" c="dimmed">Applied {new Date(job.applied_at).toLocaleDateString('en-GB')}</Text>
                            </Group>
                        )}
                        {form.values.source && (
                            <Group gap={6}>
                                <ThemeIcon size="sm" variant="transparent" c="dimmed"><IconLink size={14} /></ThemeIcon>
                                <Text size="sm" c="dimmed">{form.values.source.replace('_', ' ')}</Text>
                            </Group>
                        )}
                    </Group>
                </Paper>

                <Grid>
                    {/* ── LEFT COLUMN ── */}
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        {/* Details */}
                        <Paper withBorder p="lg" radius="md" mb="md">
                            <Divider label="Job Details" labelPosition="left" mb="md" />
                            <Grid>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Company"
                                        leftSection={<IconBriefcase size={15} />}
                                        {...form.getInputProps('company')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Job Title"
                                        {...form.getInputProps('job_title')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Location"
                                        leftSection={<IconMapPin size={15} />}
                                        {...form.getInputProps('location')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Estimated Salary (₹)"
                                        type="number"
                                        leftSection={<IconCurrencyRupee size={15} />}
                                        {...form.getInputProps('salary_est')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Contact"
                                        placeholder="HR Name, Email..."
                                        leftSection={<IconUser size={15} />}
                                        {...form.getInputProps('contacts')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Job Link"
                                        leftSection={<IconExternalLink size={15} />}
                                        rightSection={
                                            form.values.application_link && (
                                                <ActionIcon variant="subtle" onClick={() => window.open(form.values.application_link, '_blank')}>
                                                    <IconExternalLink size={16} />
                                                </ActionIcon>
                                            )
                                        }
                                        {...form.getInputProps('application_link')}
                                    />
                                </Grid.Col>
                            </Grid>
                        </Paper>

                        {/* Notes */}
                        <Paper withBorder p="lg" radius="md" mb="md">
                            <Divider label="Notes" labelPosition="left" mb="md" />
                            <Textarea
                                minRows={6}
                                placeholder="Write down your thoughts, interview prep notes, or questions..."
                                {...form.getInputProps('notes')}
                            />
                        </Paper>

                        <DocumentsSection jobId={id!} />
                    </Grid.Col>

                    {/* ── RIGHT COLUMN ── */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper withBorder p="lg" radius="md" mb="md">
                            <Divider label="Status & Classification" labelPosition="left" mb="md" />
                            <Stack gap="sm">
                                <Select
                                    label="Status"
                                    data={['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'REPLIED']}
                                    {...form.getInputProps('status')}
                                />
                                <Select
                                    label="Confidence"
                                    data={['HIGH', 'MEDIUM', 'LOW']}
                                    {...form.getInputProps('confidence')}
                                />
                                <Select
                                    label="Source"
                                    data={['LINKEDIN', 'REFERRAL', 'JOB_PORTAL', 'COMPANY_WEBSITE', 'COLLEGE', 'NETWORKING', 'RECRUITER', 'OTHER']}
                                    {...form.getInputProps('source')}
                                />
                                <Select
                                    label="Role Type"
                                    data={['Full Time', 'Part Time', 'Internship', 'Contract']}
                                    {...form.getInputProps('role_type')}
                                />
                                <Autocomplete
                                    label="Duration"
                                    placeholder="e.g. Permanent, 6 Months"
                                    data={['2 Months', '3 Months', '6 Months', '1 Year', 'Permanent']}
                                    {...form.getInputProps('duration')}
                                />
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </form>

            {/* InterviewsSection is OUTSIDE the form to avoid nested form issues */}
            <InterviewsSection jobId={id!} />

        </Container>
    </>
    );
}