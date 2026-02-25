import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Title, Text, Paper, Group, Button, Grid, TextInput, Select, Textarea, ActionIcon, Loader } from "@mantine/core";
import { IconArrowLeft, IconExternalLink } from '@tabler/icons-react';
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import api from "../api";
import { Autocomplete } from "@mantine/core";
import DocumentsSection from "./DocumentSection";
import InterviewsSection from "./InterviewSection";

export default function JobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState<any>(null);

    const form = useForm({
        initialValues: {
            company: '',
            job_title: '',
            status: '',
            location: '',
            application_link: '',
            notes: '',
            confidence: '',
            salary_est: '',
            source: '',
            role_type: '',
            duration: '',
            contacts: '',
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
            }catch (error: any) {
                notifications.show({title: 'Error', message: 'Job not found', color: 'red'});
                navigate('/dashboard');
            }finally {
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
            notifications.show({title: 'Saved', message: 'Job updated', color: 'green'});
        }catch (error: any) {
            console.error('Update error:', error.response?.data);
            notifications.show({title: 'Error', message: 'Failed to update', color: 'red'});
        }
    };

    if (loading) return <Container mt='xl'><Loader/></Container>;

    return (
    <Container size="lg" my={40}>
      <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/dashboard')} mb="md">
        Back to Dashboard
      </Button>

      <form onSubmit={form.onSubmit(handleUpdate)}>
        <Group justify="space-between" mb="xl">
          <div>
            <Title>{form.values.company}</Title>
            <Text size="xl" c="dimmed">{form.values.job_title}</Text>
          </div>
          <Button size="md" type="submit">Save Changes</Button>
        </Group>

        <Grid>
          {/* LEFT COLUMN: Main Info */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper withBorder p="md" radius="md" mb="md">
              <Title order={4} mb="md">Details</Title>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput label="Company" {...form.getInputProps('company')} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput label="Job Title" {...form.getInputProps('job_title')} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput label="Location" {...form.getInputProps('location')} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput label="Estimated Salary" type="number" {...form.getInputProps('salary_est')} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput label="Contacts" placeholder="HR Name, Email..." {...form.getInputProps('contacts')} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput 
                    label="Job Link" 
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

            <Paper withBorder p="md" radius="md">
              <Title order={4} mb="md">Notes</Title>
              <Textarea 
                minRows={6} 
                placeholder="Write down your thoughts, interview notes, or questions..." 
                {...form.getInputProps('notes')} 
              />
            </Paper>

            <DocumentsSection jobId={id!} /> 
          </Grid.Col>

          {/* RIGHT COLUMN: Sidebar (Status/Metadata) */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="md" radius="md" mb="md">
              <Title order={4} mb="md">Status & Type</Title>
              <Select
                label="Current Status"
                data={['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'REPLIED']}
                mb="md"
                {...form.getInputProps('status')}
              />
              <Select
                label="Confidence"
                data={['HIGH', 'MEDIUM', 'LOW']}
                mb="md"
                {...form.getInputProps('confidence')}
              />
              <Select
                label="Source"
                data={['LINKEDIN', 'REFERRAL', 'JOB_PORTAL', 'COMPANY_WEBSITE', 'COLLEGE', 'NETWORKING', 'RECRUITER', 'OTHER']}
                mb="md"
                {...form.getInputProps('source')}
              />
              <Select
                label="Role Type"
                data={['Full Time', 'Part Time', 'Internship', 'Contract']}
                mb="md"
                {...form.getInputProps('role_type')}
              />
              <Autocomplete
                label="Duration"
                placeholder="e.g. Permanent, 6 Months"
                data={['2 Months',  '3 Months', '6 Months', '1 Year']}
                mb="md"
                {...form.getInputProps('duration')}/>
            </Paper>

            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Text size="sm" c="dimmed">Created: {new Date(job.applied_at).toLocaleDateString()}</Text>
            </Paper>
          </Grid.Col>
        </Grid>
      </form>

      {/* InterviewsSection is OUTSIDE the form to avoid nested form issues */}
      <InterviewsSection jobId={id!}/>

    </Container>
  );
}