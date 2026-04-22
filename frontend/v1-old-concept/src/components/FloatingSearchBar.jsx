import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { useTheme } from '../context/ThemeContext';

const FloatingSearchBar = ({ onSearchClick }) => {
  const { isDark } = useTheme();
  
  return (
    <div className="absolute top-3 left-3 right-3 z-30 md:hidden">
      <button
        onClick={onSearchClick}
        className={`w-full px-5 py-3.5 rounded-2xl shadow-lg flex items-center gap-3 hover:shadow-xl transition-shadow ${
          isDark 
            ? 'bg-black border border-green-800/50' 
            : 'bg-white border border-gray-200'
        }`}
      >
        <HiOutlineMagnifyingGlass className={`text-lg ${isDark ? 'text-green-500' : 'text-green-600'}`} />
        <span className={`text-sm ${isDark ? 'text-green-600' : 'text-gray-400'}`}>Search nearby editors...</span>
      </button>
    </div>
  );
};

export default FloatingSearchBar;
