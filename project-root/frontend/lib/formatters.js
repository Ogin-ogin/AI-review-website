export const formatCurrency = (value, locale = 'ja-JP', currency = 'JPY') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  };
  
  export const formatDate = (date, locale = 'ja-JP') => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };