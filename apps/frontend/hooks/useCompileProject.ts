import axiosClient from '@/lib/axiosClient';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export function useCompileProject() {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();
    const params = useParams();
    
    return useMutation({
        mutationFn: async () => {
            const token = await getToken();
            const res = await axiosClient.post('/compile', {
                project_id: params.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        onSuccess: (data) => {
            // Invalidate and refetch file tree
            queryClient.invalidateQueries({ 
                queryKey: [`Project_tree_${params.id}`] 
            });
        }
    });
}

