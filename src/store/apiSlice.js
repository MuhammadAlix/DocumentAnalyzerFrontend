import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['History', 'Chat'],
  endpoints: (builder) => ({

    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Data
    getVoices: builder.query({
      query: () => '/voices',
    }),
    getHistory: builder.query({
      query: () => '/history',
      providesTags: ['History'],
    }),
    getChat: builder.query({
      query: (id) => `/history/${id}`,
      providesTags: (result, error, id) => [{ type: 'Chat', id }],
    }),
    
  }),
});

export const { 
  useLoginMutation, 
  useRegisterMutation, 
  useGetVoicesQuery, 
  useGetHistoryQuery,
  useGetChatQuery 
} = apiSlice;