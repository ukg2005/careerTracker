import { useEffect, useState } from "react";
import {
    Container, Title, Paper, TextInput, Textarea, Button, Group,
    Loader, Text, Avatar, Grid, NumberInput, Divider, Center
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
    IconBrandLinkedin, IconBrandGithub, IconWorld,
    IconPhone, IconMapPin, IconStar, IconBriefcase
} from "@tabler/icons-react";
import api from "../api";
import Navbar from "../components/Navbar";

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');

    const form = useForm({
        initialValues: {
            first_name: '',
            last_name: '',
            bio: '',
            phone: '',
            location: '',
            target_role: '',
            skills: '',
            years_exp: '' as number | '',
            linkedin_url: '',
            github_url: '',
            portfolio_url: '',
        },
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('users/profile/');
                const { user, bio, phone, location, target_role, skills, years_exp,
                        linkedin_url, github_url, portfolio_url } = response.data;
                setEmail(user?.email || '');
                form.setValues({
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    bio: bio || '',
                    phone: phone || '',
                    location: location || '',
                    target_role: target_role || '',
                    skills: skills || '',
                    years_exp: years_exp ?? '',
                    linkedin_url: linkedin_url || '',
                    github_url: github_url || '',
                    portfolio_url: portfolio_url || '',
                });
            } catch {
                notifications.show({ title: 'Error', message: 'Failed to load profile', color: 'red' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (values: typeof form.values) => {
        try {
            await api.patch('users/profile/', {
                user: { first_name: values.first_name, last_name: values.last_name },
                bio: values.bio,
                phone: values.phone,
                location: values.location,
                target_role: values.target_role,
                skills: values.skills,
                years_exp: values.years_exp === '' ? null : values.years_exp,
                linkedin_url: values.linkedin_url || null,
                github_url: values.github_url || null,
                portfolio_url: values.portfolio_url || null,
            });
            notifications.show({ title: 'Saved', message: 'Profile updated', color: 'green' });
        } catch (error: any) {
            console.error('Profile update error:', error.response?.data);
            notifications.show({ title: 'Error', message: 'Failed to save profile', color: 'red' });
        }
    };

    if (loading) return (
        <><Navbar /><Container><Center style={{ height: '60vh' }}><Loader size='xl' /></Center></Container></>
    );

    const initials = `${form.values.first_name?.[0] || ''}${form.values.last_name?.[0] || ''}`.toUpperCase() || '?';

    return (
        <>
            <Navbar />
            <Container size="md" my={40}>
                <Title order={2} mb="xl">Profile</Title>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Paper withBorder p="xl" radius="md" mb="md">
                        {/* Header */}
                        <Group mb="xl">
                            <Avatar size={72} radius="xl" color="blue">{initials}</Avatar>
                            <div>
                                <Text fw={700} size="lg">
                                    {form.values.first_name || 'Your'} {form.values.last_name || 'Name'}
                                </Text>
                                <Text size="sm" c="dimmed">{email}</Text>
                            </div>
                        </Group>

                        <Divider label="Personal Info" labelPosition="left" mb="md" />
                        <Grid>
                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <TextInput label="First Name" placeholder="John" {...form.getInputProps('first_name')} />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <TextInput label="Last Name" placeholder="Smith" {...form.getInputProps('last_name')} />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <TextInput
                                    label="Phone"
                                    placeholder="+91 98765 43210"
                                    leftSection={<IconPhone size={16} />}
                                    {...form.getInputProps('phone')}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <TextInput
                                    label="Location"
                                    placeholder="Bangalore, India"
                                    leftSection={<IconMapPin size={16} />}
                                    {...form.getInputProps('location')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Bio"
                                    placeholder="Tell us a bit about yourself..."
                                    minRows={3}
                                    {...form.getInputProps('bio')}
                                />
                            </Grid.Col>
                        </Grid>

                        <Divider label="Career" labelPosition="left" mt="xl" mb="md" />
                        <Grid>
                            <Grid.Col span={{ base: 12, sm: 8 }}>
                                <TextInput
                                    label="Target Role"
                                    placeholder="e.g. Backend Engineer, Data Scientist"
                                    leftSection={<IconBriefcase size={16} />}
                                    {...form.getInputProps('target_role')}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                                <NumberInput
                                    label="Years of Experience"
                                    placeholder="0"
                                    min={0}
                                    max={50}
                                    leftSection={<IconStar size={16} />}
                                    value={form.values.years_exp}
                                    onChange={(val) => form.setFieldValue('years_exp', typeof val === 'number' ? val : '')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Skills"
                                    placeholder="Python, Django, React, PostgreSQL, Docker..."
                                    description="Comma-separated list of your skills"
                                    minRows={2}
                                    {...form.getInputProps('skills')}
                                />
                            </Grid.Col>
                        </Grid>

                        <Divider label="Links" labelPosition="left" mt="xl" mb="md" />
                        <Grid>
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                                <TextInput
                                    label="LinkedIn"
                                    placeholder="linkedin.com/in/yourname"
                                    leftSection={<IconBrandLinkedin size={16} />}
                                    {...form.getInputProps('linkedin_url')}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                                <TextInput
                                    label="GitHub"
                                    placeholder="github.com/yourname"
                                    leftSection={<IconBrandGithub size={16} />}
                                    {...form.getInputProps('github_url')}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                                <TextInput
                                    label="Portfolio"
                                    placeholder="yourwebsite.com"
                                    leftSection={<IconWorld size={16} />}
                                    {...form.getInputProps('portfolio_url')}
                                />
                            </Grid.Col>
                        </Grid>
                    </Paper>

                    <Button fullWidth type="submit" size="md">Save Profile</Button>
                </form>
            </Container>
        </>
    );
}
