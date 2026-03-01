import { Group, Text, Button, Container } from "@mantine/core";
import { IconBriefcase } from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div style={{ borderBottom: '1px solid #e9ecef', backgroundColor: '#fff', marginBottom: 0 }}>
            <Container size="lg">
                <Group justify="space-between" h={56}>
                    <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                        <IconBriefcase size={22} color="#228be6" />
                        <Text fw={700} size="lg" c="blue">CareerTracker</Text>
                    </Group>

                    <Group gap="xs">
                        <Button
                            variant={isActive('/dashboard') ? 'light' : 'subtle'}
                            size="sm"
                            onClick={() => navigate('/dashboard')}
                        >
                            Dashboard
                        </Button>
                        <Button
                            variant={isActive('/analytics') ? 'light' : 'subtle'}
                            size="sm"
                            onClick={() => navigate('/analytics')}
                        >
                            Analytics
                        </Button>
                        <Button
                            variant={isActive('/profile') ? 'light' : 'subtle'}
                            size="sm"
                            onClick={() => navigate('/profile')}
                        >
                            Profile
                        </Button>
                        <Button variant="subtle" color="red" size="sm" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Group>
                </Group>
            </Container>
        </div>
    );
}
