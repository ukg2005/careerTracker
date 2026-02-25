import { useEffect, useState } from "react";
import { Container, Title, Table, Badge, Button, Group, Loader, Paper, Select, TextInput, ActionIcon } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Modal } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

interface Job {
    id: number;
    company: string;
    job_title: string;
    status: string;
    applied_at: string;
}

export default function Dashboard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            company: '',
            job_title: '',
            role_type: 'Full Time',
            status: 'APPLIED',
            location: '',
            application_link: '',
            duration: 'Permenant',
            confidence: 'MEDIUM',
            source: 'LINKEDIN',
        },
    });

    const fetchJobs = async () => {
        try {
            const response = await api.get('jobs/');
            setJobs(response.data)
        }catch (error: any) {
            console.error('Failed to fetch jobs', error);
            if (error.response?.status == 401) {
                handleLogout();
            }
        }finally {
            setLoading(false);
        }
    };

    useEffect(()=>{
        fetchJobs();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    const openCreateModal = () => {
        setEditingJob(null);
        form.reset();
        open();
    };

    const handleSubmit = async (values: typeof form.values) => {
        try {
            if (editingJob) {
                await api.patch(`jobs/${editingJob.id}/`, values);
                notifications.show({title: 'Updated', message: 'Job updated successfully', color: 'blue'});
            }else {
                await api.post('jobs/', values);
                notifications.show({title: 'Success', message: 'Job added', color: 'green'});
            }
            close();
            fetchJobs();
        }catch (error: any) {
            notifications.show({title: 'Error', message: 'Operation failed', color: 'red'});
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await api.delete(`jobs/${id}/`);
                notifications.show({title: 'Deleted', message: 'Job deleted successfully', color: 'gray'});
                fetchJobs();
            }catch (error) {
                notifications.show({title: 'Error', message: 'Failed to delete', color: 'red'});
            }
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OFFER': return 'green';
            case 'INTERVIEW': return 'blue';
            case 'REJECTED': return 'red';
            default: return 'gray';
        }
    };

    return (
    <Container size="lg" my={40}>
      <Group justify="space-between" mb="xl">
        <Title order={2}>My Job Applications</Title>
        <Group>
          <Button onClick={openCreateModal}>+ Add Job</Button>
          <Button variant="light" color="red" onClick={handleLogout}>Logout</Button>
        </Group>
      </Group>

      <Modal opened={opened} onClose={close} title={editingJob ? "Edit Job" : "Add New Job"} centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Company" placeholder="Google" required mb="sm" {...form.getInputProps('company')} />
          <TextInput label="Job Title" placeholder="Frontend Engineer" required mb="sm" {...form.getInputProps('job_title')} />
          <TextInput label="Location" placeholder="Remote" mb="sm" {...form.getInputProps('location')} />
          <TextInput label="Link" placeholder="https://..." mb="sm" {...form.getInputProps('link')} />
          
          <Select
            label="Status"
            data={['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']}
            required
            mb="sm"
            {...form.getInputProps('status')}
          />

          <Select
            label="Confidence"
            data={['HIGH', 'MEDIUM', 'LOW']}
            required
            mb="sm"
            {...form.getInputProps('confidence')}
          />

          <Select
            label="Duration"
            data={['Permenant', 'Contract', 'Internship']}
            required
            mb="sm"
            {...form.getInputProps('duration')}
          />

          <Select
            label="Source"
            data={['LINKEDIN', 'REFERRAL', 'JOB_PORTAL', 'COMPANY_WEBSITE', 'OTHER']}
            required
            mb="xl"
            {...form.getInputProps('source')}
          />

          <Button fullWidth type="submit">{editingJob ? "Update" : "Save"}</Button>
        </form>
      </Modal>

      <Paper withBorder shadow="sm" p="md" radius="md">
        {loading ? <Loader /> : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Company</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {jobs.map((job) => (
                <Table.Tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)} >
                  <Table.Td fw={500}>{job.company}</Table.Td>
                  <Table.Td>{job.job_title}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(job.status)} variant="light">{job.status}</Badge>
                  </Table.Td>
                  <Table.Td>{new Date(job.applied_at).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="subtle" color="red" onClick={(e) => handleDelete(e, job.id)}>
                            <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Container>
  );
}