import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function PageBuilderNav() {
  const navigate = useNavigate();
  return (
    <Button onClick={() => navigate('/dashboard/pages')}>
      📄 Lav Hjemmeside
    </Button>
  );
}
