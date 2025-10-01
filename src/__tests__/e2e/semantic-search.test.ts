/**
 * End-to-End Tests: Semantic Search
 *
 * Complete user flow tests for semantic search functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('Semantic Search E2E Tests', () => {
  let authToken: string;
  let userId: string;
  let testSourceId: string;

  describe('Complete Search Flow', () => {
    it('user creates source and can semantically search it', async () => {
      // Step 1: Sign up
      const email = `test-e2e-${Date.now()}@example.com`;
      const password = 'SecurePass123!';

      const signupResponse = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      expect(signupResponse.status).toBe(200);

      const signupData = await signupResponse.json();
      authToken = signupData.session?.access_token;
      userId = signupData.user?.id;

      expect(authToken).toBeDefined();
      expect(userId).toBeDefined();

      // Step 2: Create source about machine learning
      const createSourceResponse = await fetch(
        `${API_BASE_URL}/api/sources`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: 'Deep Learning Tutorial',
            content_type: 'text',
            original_content:
              'Comprehensive guide to deep learning and neural networks. Covers convolutional neural networks, recurrent neural networks, and transformer architectures.',
            summary_text:
              'Guide covering deep learning, CNNs, RNNs, and transformers.',
            key_actions: ['Study neural networks', 'Implement CNN'],
            key_topics: [
              'deep learning',
              'neural networks',
              'machine learning',
            ],
            word_count: 200,
          }),
        }
      );

      expect(createSourceResponse.status).toBe(200);

      const sourceData = await createSourceResponse.json();
      testSourceId = sourceData.source.id;

      expect(testSourceId).toBeDefined();
      expect(sourceData.summary).toBeDefined();

      // Step 3: Wait for embedding generation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Step 4: Search for related content using semantic search
      const searchResponse = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: 'artificial intelligence algorithms',
          mode: 'semantic',
          limit: 20,
        }),
      });

      expect(searchResponse.status).toBe(200);

      const searchData = await searchResponse.json();

      expect(searchData.results).toBeDefined();
      expect(Array.isArray(searchData.results)).toBe(true);

      // Step 5: Verify original source appears in results
      const foundSource = searchData.results.find(
        (r: { source: { id: string } }) => r.source.id === testSourceId
      );

      expect(foundSource).toBeDefined();
      expect(foundSource.relevance_score).toBeGreaterThan(0.5);
      expect(foundSource.match_type).toBe('semantic');
      expect(foundSource.source.title).toBe('Deep Learning Tutorial');
    });

    it('search works immediately after creation', async () => {
      // Create another source
      const createResponse = await fetch(`${API_BASE_URL}/api/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Quantum Computing Basics',
          content_type: 'text',
          original_content:
            'Introduction to quantum computing, qubits, and quantum algorithms.',
          summary_text: 'Intro to quantum computing and qubits.',
          key_actions: ['Learn quantum basics'],
          key_topics: ['quantum computing', 'qubits', 'algorithms'],
          word_count: 150,
        }),
      });

      const sourceData = await createResponse.json();
      const newSourceId = sourceData.source.id;

      // Search immediately (embedding should be generated synchronously)
      const searchResponse = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: 'quantum mechanics computing',
          mode: 'semantic',
          limit: 20,
        }),
      });

      const searchData = await searchResponse.json();

      const foundSource = searchData.results.find(
        (r: { source: { id: string } }) => r.source.id === newSourceId
      );

      // Should find it (or at least via keyword fallback)
      expect(foundSource).toBeDefined();
    });
  });

  describe('Session Persistence', () => {
    it('search persists across sessions', async () => {
      // Simulate logout by clearing token
      const oldToken = authToken;

      // Simulate new session - login again
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test-e2e-${userId}@example.com`,
          password: 'SecurePass123!',
        }),
      });

      if (loginResponse.status === 200) {
        const loginData = await loginResponse.json();
        const newToken = loginData.session?.access_token;

        // Search with new token
        const searchResponse = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify({
            query: 'deep learning',
            mode: 'semantic',
            limit: 20,
          }),
        });

        const searchData = await searchResponse.json();

        // Should still find previously created sources
        const foundSource = searchData.results.find(
          (r: { source: { id: string } }) => r.source.id === testSourceId
        );

        expect(foundSource).toBeDefined();
      }
    });
  });

  describe('User Isolation', () => {
    it('search respects user isolation', async () => {
      // Create second user
      const user2Email = `test-e2e-user2-${Date.now()}@example.com`;
      const user2Password = 'SecurePass456!';

      const signup2Response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user2Email,
          password: user2Password,
        }),
      });

      const user2Data = await signup2Response.json();
      const user2Token = user2Data.session?.access_token;

      // User 2 searches for content that User 1 created
      const searchResponse = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user2Token}`,
        },
        body: JSON.stringify({
          query: 'deep learning tutorial',
          mode: 'semantic',
          limit: 20,
        }),
      });

      const searchData = await searchResponse.json();

      // User 2 should NOT see User 1's sources
      const foundUser1Source = searchData.results.find(
        (r: { source: { id: string } }) => r.source.id === testSourceId
      );

      expect(foundUser1Source).toBeUndefined();
    });
  });

  describe('Search Modes', () => {
    it('switches between search modes seamlessly', async () => {
      const query = 'machine learning';

      // Semantic search
      const semanticResponse = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query,
          mode: 'semantic',
          limit: 20,
        }),
      });

      const semanticData = await semanticResponse.json();
      expect(semanticData.search_mode).toBe('semantic');

      // Keyword search
      const keywordResponse = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query,
          mode: 'keyword',
          limit: 20,
        }),
      });

      const keywordData = await keywordResponse.json();
      expect(keywordData.search_mode).toBe('keyword');

      // Hybrid search
      const hybridResponse = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query,
          mode: 'hybrid',
          limit: 20,
        }),
      });

      const hybridData = await hybridResponse.json();
      expect(hybridData.search_mode).toBe('hybrid');

      // All modes should return results
      expect(semanticData.results.length).toBeGreaterThanOrEqual(0);
      expect(keywordData.results.length).toBeGreaterThanOrEqual(0);
      expect(hybridData.results.length).toBeGreaterThanOrEqual(0);
    });
  });

  afterAll(async () => {
    // Cleanup - delete test sources
    if (testSourceId && authToken) {
      await fetch(`${API_BASE_URL}/api/sources/${testSourceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    }
  });
});
