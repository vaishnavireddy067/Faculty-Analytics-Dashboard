from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from faculty_data.models import Publication

User = get_user_model()

class AuthAndMultiAccountTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.faculty_a = User.objects.create_user(
            username='faculty_a',
            email='faculty_a@avn.edu.in',
            password='Password123!',
            first_name='Faculty',
            last_name='A'
        )
        self.faculty_a.role = 'FACULTY'
        self.faculty_a.save()

        self.faculty_b = User.objects.create_user(
            username='faculty_b',
            email='faculty_b@avn.edu.in',
            password='Password456!',
            first_name='Faculty',
            last_name='B'
        )
        self.faculty_b.role = 'FACULTY'
        self.faculty_b.save()

        # Create private publications for Faculty A and Faculty B
        Publication.objects.create(
            faculty=self.faculty_a,
            title='Paper A by Faculty A',
            journal_name='Journal A',
            year=2025
        )
        Publication.objects.create(
            faculty=self.faculty_b,
            title='Paper B by Faculty B',
            journal_name='Journal B',
            year=2025
        )

    def test_login_success_faculty_a(self):
        res = self.client.post('/api/token/', {
            'username': 'faculty_a@avn.edu.in',
            'password': 'Password123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'faculty_a')

    def test_login_invalid_password(self):
        res = self.client.post('/api/token/', {
            'username': 'faculty_a@avn.edu.in',
            'password': 'WrongPassword'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_refresh(self):
        login_res = self.client.post('/api/token/', {
            'username': 'faculty_a@avn.edu.in',
            'password': 'Password123!'
        }, format='json')
        refresh_token = login_res.data['refresh']

        ref_res = self.client.post('/api/token/refresh/', {
            'refresh': refresh_token
        }, format='json')
        self.assertEqual(ref_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', ref_res.data)

    def test_multi_device_multi_account_isolation(self):
        # Device 1: Login as Faculty A
        res_a = self.client.post('/api/token/', {
            'username': 'faculty_a@avn.edu.in',
            'password': 'Password123!'
        }, format='json')
        token_a = res_a.data['access']

        # Device 2: Login as Faculty B
        res_b = self.client.post('/api/token/', {
            'username': 'faculty_b@avn.edu.in',
            'password': 'Password456!'
        }, format='json')
        token_b = res_b.data['access']

        # Faculty A requests publications -> only sees Paper A
        client_a = APIClient()
        client_a.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')
        pubs_a = client_a.get('/api/faculty/publications/')
        self.assertEqual(pubs_a.status_code, status.HTTP_200_OK)
        pub_titles_a = [p['title'] for p in pubs_a.data]
        self.assertIn('Paper A by Faculty A', pub_titles_a)
        self.assertNotIn('Paper B by Faculty B', pub_titles_a)

        # Faculty B requests publications -> only sees Paper B
        client_b = APIClient()
        client_b.credentials(HTTP_AUTHORIZATION=f'Bearer {token_b}')
        pubs_b = client_b.get('/api/faculty/publications/')
        self.assertEqual(pubs_b.status_code, status.HTTP_200_OK)
        pub_titles_b = [p['title'] for p in pubs_b.data]
        self.assertIn('Paper B by Faculty B', pub_titles_b)
        self.assertNotIn('Paper A by Faculty A', pub_titles_b)
