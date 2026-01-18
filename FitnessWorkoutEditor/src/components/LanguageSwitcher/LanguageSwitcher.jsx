import { useTranslation } from '../../i18n/I18nContext';
import './LanguageSwitcher.css';

function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="language-switcher">
      <select 
        value={language} 
        onChange={handleLanguageChange}
        className="language-select"
      >
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}

export default LanguageSwitcher;
