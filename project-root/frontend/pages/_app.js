import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { FilterProvider } from '../context/FilterContext';
import Layout from '../components/common/Layout';
import '../styles/globals.css';

const MyApp = ({ Component, pageProps }) => {
  return (
    <ThemeProvider>
      <FilterProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </FilterProvider>
    </ThemeProvider>
  );
};

export default MyApp;