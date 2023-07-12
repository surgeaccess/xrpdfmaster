import { useState, useEffect } from 'react';

export function useConfig() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/config.json');
        const configData = await response.json();
        setConfig(configData);
      } catch (error) {
        console.error('Error loading configuration file:', error);
      }
    }

    loadConfig();
  }, []);

  return config;
}
