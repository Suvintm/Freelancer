import { useNavigate } from 'react-router-dom';
import { GatewayOfflineScreen } from '../components/common/GatewayOfflineScreen';
import { useTheme } from '../hooks/useTheme';

export default function Maintenance() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <GatewayOfflineScreen
      isDarkMode={isDarkMode}
      onRetrySuccess={() => navigate('/', { replace: true })}
    />
  );
}

