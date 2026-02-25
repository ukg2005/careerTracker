import { useEffect } from "react";
import { TextInput, Button, Paper, Title, Container, Text } from "@mantine/core";
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from "react-router-dom";
import api from '../api';

export default function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }, []);

    const form = useForm({
        initialValues: {
            email: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
        },
    });

    const handleLogin = async (values: {email: string}) => {
        try {
            await api.post('users/send-otp/', {email: values.email});

            notifications.show({
                title: 'OTP Sent',
                message: 'Check your email for the verification code.',
                color: 'green',
            });

            localStorage.setItem('pending_email', values.email);
            navigate('/verify-otp');
        }catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'Failed to send OTP',
                color: 'red',
            });
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta='center' order={2}>
                Welcome back!
            </Title>
            <Text c='dimmed' size='sm' ta='center' mt={5} mb={30}>
                Enter your email to receive a login code
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius='md'>
                <form onSubmit={form.onSubmit(handleLogin)}>
                    <TextInput
                        label='email'
                        placeholder="you@matine.dev"
                        required
                        {...form.getInputProps('email')}
                    />
                    <Button fullWidth mt='xl' type="submit">
                        Send OTP
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}