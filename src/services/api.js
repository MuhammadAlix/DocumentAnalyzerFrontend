import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const docApi = createApi({
  reducerPath: 'docApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://192.168.100.61/api/' }),
  endpoints: (builder) => ({
    analyzeDocument: builder.mutation({
      query: (formData) => ({
        url: 'analyze',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const { useAnalyzeDocumentMutation } = docApi;