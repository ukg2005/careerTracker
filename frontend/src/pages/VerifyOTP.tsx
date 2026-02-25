import { useState, useEffect } from "react";
import { Button, Paper, Title, Container, Text, PinInput, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function VerifyOTP() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const email = localStorage.getItem('pending_email');

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!email && !token) {
            navigate('/login');
        }
    }, [email, navigate]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            notifications.show({
                title: 'Error',
                message: 'Please enter all 6 digits',
                color: 'red'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('users/verify-otp/', {email, otp});

            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.removeItem('pending_email');

            notifications.show({
                title: 'Success!',
                message: 'You are now logged in.',
                color: 'green'
            });
            navigate('/dashboard');
        }catch (error: any) {
            notifications.show({
                title: 'Verification Failed',
                message: error.response?.data?.error || 'Invalid or expired OTP',
                color: 'red',
            });
        }finally {
            setLoading(false);
        }
    };

    return (
        <Container size={420} my={40}>
        <Title ta="center" order={2}>
            Check your email
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
            We sent a 6-digit code to <strong>{email}</strong>
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <Group justify="center" mb="xl">
            {/* Mantine's built-in OTP input! */}
            <PinInput 
                length={6} 
                value={otp} 
                onChange={setOtp} 
                size="lg" 
                type="number"
            />
            </Group>
            
            <Button fullWidth loading={loading} onClick={handleVerify}>
            Verify & Login
            </Button>
        </Paper>
        </Container>
    );
}