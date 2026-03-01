import { useEffect, useState } from "react";
import { Paper, Title, Group, Text, Button, ActionIcon, FileButton, Loader, Select } from "@mantine/core";
import { IconFileText, IconTrash, IconUpload } from "@tabler/icons-react";
import { notifications } from '@mantine/notifications'
import api from "../api";

interface Document {
    id: number;
    file: string;
    doc_types: string;
    uploaded_at: string;
    job: number;
}

export default function DocumentsSection({ jobId }: { jobId: string }) {
    const [docs, setDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState<string | null>('RESUME');

    const fetchDocs = async () => {
        try {
            const response = await api.get('jobs/documents/');
            const jobDocs = response.data.filter((d: any) => d.job === Number(jobId));
            setDocs(jobDocs);
        }catch (error) {
            console.error('Failed to load documents');
        }finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, [jobId]);

    const handleUpload = async () => {
        if (!file || !docType) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('doc_types', docType || 'RESUME');
            formData.append('job', jobId);

            await api.post('jobs/documents/', formData);
            
            notifications.show({
                title: 'Success',
                message: 'File uploaded successfully',
                color: 'teal',
            });
            
            setFile(null);
            fetchDocs();
        } catch (error) {
            console.error('Upload error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to upload file. Please try again.',
                color: 'red'
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this file?')) return;
        try {
            await api.delete(`jobs/documents/${id}/`);
            notifications.show({title: 'Deleted', message: 'File deleted', color: 'gray'});
            setDocs(docs.filter(d => d.id !== id));
        }catch (error) {
            notifications.show({title: 'Error', message: 'Upload failed', color: 'red'});
        }
    };

    return (
    <Paper withBorder p="md" radius="md" mt="xl">
      <Title order={4} mb="md">Documents & Files</Title>

      {/* UPLOAD AREA */}
      <Group align="flex-end" mb="lg">
        <FileButton onChange={setFile} accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
          {(props) => <Button {...props} leftSection={<IconUpload size={16}/>}>Select File</Button>}
        </FileButton>
        
        {file && <Text size="sm">{file.name}</Text>}
        
        <Select 
            data={['RESUME', 'COVER LETTER', 'COLD EMAIL', 'OTHERS']} 
            value={docType} 
            onChange={setDocType}
            w={150}
        />
        
        <Button disabled={!file} onClick={handleUpload}>Upload</Button>
      </Group>

      {/* LIST AREA */}
      {loading ? <Loader size="sm" /> : docs.length === 0 ? (
        <Text c="dimmed" size="sm">No documents attached yet.</Text>
      ) : (
        docs.map((doc) => (
          <Group key={doc.id} justify="space-between" mb="xs" p="xs" bg="gray.0" style={{ borderRadius: 4 }}>
            <Group>
                <IconFileText size={20} color="gray" />
                <div>
                    <Text size="sm" fw={500}>{doc.doc_types}</Text>
                    <Text size="xs" c="dimmed">
                        <a href={doc.file} target="_blank" rel="noreferrer">Download / View</a>
                        {' • '} 
                        {new Date(doc.uploaded_at).toLocaleDateString('en-GB')}
                    </Text>
                </div>
            </Group>
            <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(doc.id)}>
                <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ))
      )}
    </Paper>
  );
}