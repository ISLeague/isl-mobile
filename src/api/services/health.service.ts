import axios from 'axios';

export const healthService = {
  check: async () => {
    const response = await axios.get(
      'https://htjksrcbpozlgjqpqguw.supabase.co/functions/v1/health-check'
    );
    return response.data;
  },
};
