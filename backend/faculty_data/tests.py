from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from core.models import User
from faculty_data.models import Publication, Patent, Book, Grant, FacultyRole, AuditLog

class FacultyAnalyticsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testfaculty',
            password='testpassword123',
            first_name='Dr. Test',
            last_name='Professor',
            department='Computer Science & Engineering',
            role='FACULTY'
        )
        self.client.force_authenticate(user=self.user)

    def test_health_check(self):
        url = reverse('system_health_check_root')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'healthy')

    def test_publication_api_scoring(self):
        pub_sci = Publication.objects.create(
            faculty=self.user,
            title="Deep Learning Framework",
            journal_name="IEEE TNNLS",
            indexing="SCI",
            year=2025,
            authors="Dr. Test Professor"
        )
        self.assertEqual(pub_sci.api_score, 30.0)

        pub_scopus = Publication.objects.create(
            faculty=self.user,
            title="Cloud Edge IoT Computing",
            journal_name="Springer CCIS",
            indexing="SCOPUS",
            year=2025,
            authors="Dr. Test Professor"
        )
        self.assertEqual(pub_scopus.api_score, 20.0)

    def test_pbas_score_calculation(self):
        Publication.objects.create(
            faculty=self.user,
            title="AI Optimization",
            journal_name="Elsevier Expert Systems",
            indexing="SCI",
            year=2025,
            authors="Dr. Test Professor"
        )
        Patent.objects.create(
            faculty=self.user,
            title="Smart Sensor Device",
            patent_status="GRANTED",
            year=2025
        )
        FacultyRole.objects.create(
            faculty=self.user,
            role_name="Department IQAC Incharge",
            academic_year="2025-26"
        )
        url = reverse('calculate_pbas_score')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_pbas_score', response.data)
        self.assertGreaterEqual(response.data['total_pbas_score'], 100.0)

    def test_audit_logs_endpoint(self):
        url = reverse('audit_logs_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_department_comparison_endpoint(self):
        url = reverse('department_radar_comparison')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('departments', response.data)
        self.assertGreater(len(response.data['departments']), 0)
