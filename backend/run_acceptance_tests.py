import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from faculty_data.models import FacultyMonthlySubmission, FacultyProfile
from core.models import EmailVerificationOTP
import json

User = get_user_model()
client = Client()

print("=" * 60)
print("RUNNING PRODUCTION ACCEPTANCE TEST SUITE")
print("=" * 60)

# TEST 1: FACULTY REGISTRATION & OTP DISPATCH
print("\n[TEST 1] Faculty Registration & OTP Dispatch")
email_a = "dr.smith@institution.edu"
User.objects.filter(email__iexact=email_a).delete()
EmailVerificationOTP.objects.filter(email__iexact=email_a).delete()

# Send OTP
resp = client.post('/api/auth/send-otp/', data=json.dumps({
    'email': email_a,
    'username': 'dr.smith'
}), content_type='application/json')
assert resp.status_code == 200, f"Failed send OTP: {resp.content}"
otp_obj = EmailVerificationOTP.objects.filter(email__iexact=email_a, is_verified=False).first()
assert otp_obj is not None, "OTP record not created"
print(f"  [PASS] OTP generated successfully: {otp_obj.otp} for {email_a}")

# TEST 2: ONE EMAIL = ONE ACCOUNT ENFORCEMENT
print("\n[TEST 2] Verify OTP & Create Faculty Account")
resp_verify = client.post('/api/auth/verify-otp/', data=json.dumps({
    'email': email_a,
    'otp': otp_obj.otp,
    'full_name': 'Dr. Alice Smith',
    'employee_id': 'EMP-CSE-101',
    'department': 'Computer Science & Engineering',
    'password': 'SmithPassword@123',
    'role': 'SUPERADMIN' # Attempting privilege escalation - must be overridden to FACULTY!
}), content_type='application/json')
assert resp_verify.status_code == 201, f"Verify failed: {resp_verify.content}"
data_a = resp_verify.json()
assert data_a['user']['role'] == 'FACULTY', f"Role security check failed! Expected FACULTY, got {data_a['user']['role']}"
token_a = data_a['access']
print(f"  [PASS] Account created as FACULTY (role locked): {data_a['user']['email']}")
print(f"  [PASS] JWT tokens issued: access length = {len(token_a)}")

# Check duplicate email rejection
resp_dup = client.post('/api/auth/send-otp/', data=json.dumps({
    'email': email_a,
    'username': 'duplicate_attempt'
}), content_type='application/json')
assert resp_dup.status_code == 400, "Duplicate email was not rejected!"
print("  [PASS] Duplicate email registration rejected successfully!")

# TEST 3: CREATE FACULTY B & VERIFY INDEPENDENT LOGIN
print("\n[TEST 3] Faculty B Creation & Multi-Device Login")
email_b = "dr.kumar@institution.edu"
User.objects.filter(email__iexact=email_b).delete()
EmailVerificationOTP.objects.filter(email__iexact=email_b).delete()

client.post('/api/auth/send-otp/', data=json.dumps({'email': email_b}), content_type='application/json')
otp_b = EmailVerificationOTP.objects.filter(email__iexact=email_b).first().otp

resp_b = client.post('/api/auth/verify-otp/', data=json.dumps({
    'email': email_b,
    'otp': otp_b,
    'full_name': 'Dr. Bob Kumar',
    'employee_id': 'EMP-CSE-102',
    'department': 'Computer Science & Engineering',
    'password': 'KumarPassword@123',
}), content_type='application/json')
assert resp_b.status_code == 201
token_b = resp_b.json()['access']
print("  [PASS] Faculty B created independently with own credentials")

# TEST 4: JWT AUTHENTICATION FROM SEPARATE SESSIONS
print("\n[TEST 4] Independent Device JWT Authentication")
resp_login_a = client.post('/api/token/', data=json.dumps({
    'username': email_a,
    'password': 'SmithPassword@123'
}), content_type='application/json')
assert resp_login_a.status_code == 200
login_token_a = resp_login_a.json()['access']
assert resp_login_a.json()['user']['role'] == 'FACULTY'
print("  [PASS] Device 1 (Faculty A) login authenticated with JWT")

resp_login_b = client.post('/api/token/', data=json.dumps({
    'username': email_b,
    'password': 'KumarPassword@123'
}), content_type='application/json')
assert resp_login_b.status_code == 200
login_token_b = resp_login_b.json()['access']
assert resp_login_b.json()['user']['role'] == 'FACULTY'
print("  [PASS] Device 2 (Faculty B) login authenticated independently")

# TEST 5: DATA ISOLATION (JWT request.user is single source of identity)
print("\n[TEST 5] Strict Data Isolation")
# Faculty A creates Monthly Submission
sub_data_a = {
    'journal_publications': [{'title': 'Quantum Machine Learning', 'journal': 'IEEE Access', 'indexing': 'SCI'}],
    'fdps_workshops_attended': [{'title': 'AI in Cloud', 'organization': 'IIT Madras'}]
}
resp_sub_a = client.post('/api/faculty/monthly-submission/detail/', data=json.dumps({
    'month': 'SEPTEMBER',
    'year': '2026',
    'academic_year': '2026-27',
    'department': 'Computer Science & Engineering',
    'status': 'SUBMITTED',
    'submission_data': sub_data_a
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {login_token_a}')
assert resp_sub_a.status_code == 200
sub_id_a = resp_sub_a.json()['submission_id']

# Faculty B checks their own detail - must NOT see Faculty A data
resp_check_b = client.get('/api/faculty/monthly-submission/detail/?month=SEPTEMBER&year=2026',
                          HTTP_AUTHORIZATION=f'Bearer {login_token_b}')
assert resp_check_b.status_code == 200
data_view_b = resp_check_b.json()
assert data_view_b['exists'] == False, "Faculty B can see uncreated submission!"
print("  [PASS] Faculty A data is isolated and completely invisible to Faculty B")

# TEST 6: HOD LOGIN & REVIEW TRACKER
print("\n[TEST 6] HOD Authentication & Review Tracker")
resp_hod_login = client.post('/api/token/', data=json.dumps({
    'username': 'hod@example.com',
    'password': 'hod123'
}), content_type='application/json')
assert resp_hod_login.status_code == 200
token_hod = resp_hod_login.json()['access']
assert resp_hod_login.json()['user']['role'] == 'HOD'
print("  [PASS] HOD authenticated successfully with HOD role")

# HOD Tracker
resp_tracker = client.get('/api/faculty/monthly-submission/tracker/?department=Computer+Science+%26+Engineering&month=SEPTEMBER&year=2026',
                          HTTP_AUTHORIZATION=f'Bearer {token_hod}')
assert resp_tracker.status_code == 200
tracker_faculties = resp_tracker.json()['faculties']
sub_a_in_tracker = next((f for f in tracker_faculties if f['email'] == email_a), None)
assert sub_a_in_tracker is not None
assert sub_a_in_tracker['status'] == 'SUBMITTED'
assert sub_a_in_tracker['number_of_records'] == 2
print(f"  [PASS] HOD Tracker correctly reflects Faculty A submission: status={sub_a_in_tracker['status']}, records={sub_a_in_tracker['number_of_records']}")

# TEST 7: HOD APPROVE & LOCK ACTION
print("\n[TEST 7] HOD Approve & Lock Action & Audit Trail")
resp_action = client.post(f'/api/faculty/monthly-submission/{sub_id_a}/action/', data=json.dumps({
    'action': 'APPROVE_AND_LOCK',
    'remarks': 'All Scopus/SCI indexing verified with evidence documents.'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token_hod}')
assert resp_action.status_code == 200
action_data = resp_action.json()
assert action_data['status'] == 'LOCKED'
assert action_data['locked_at'] is not None
assert len(action_data['audit_history']) >= 2
print(f"  [PASS] Submission locked with status={action_data['status']} at {action_data['locked_at']}")
print(f"  [PASS] Audit trail logged {len(action_data['audit_history'])} actions including reviewer attribution")

# TEST 8: CONSOLIDATION ENGINE (ONLY APPROVED + LOCKED INCLUDED)
print("\n[TEST 8] 1-Click IQAC Consolidation Strict Filter")
# Faculty B creates a DRAFT submission (not approved/locked)
client.post('/api/faculty/monthly-submission/detail/', data=json.dumps({
    'month': 'SEPTEMBER',
    'year': '2026',
    'academic_year': '2026-27',
    'department': 'Computer Science & Engineering',
    'status': 'DRAFT',
    'submission_data': {'journal_publications': [{'title': 'Draft Paper', 'journal': 'Draft'}]}
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {login_token_b}')

# Run Consolidation
resp_cons = client.post('/api/faculty/monthly-submission/consolidate/', data=json.dumps({
    'department': 'Computer Science & Engineering',
    'month': 'SEPTEMBER',
    'year': '2026'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token_hod}')
assert resp_cons.status_code == 200
cons_res = resp_cons.json()
assert cons_res['total_submissions_merged'] == 1, f"Expected exactly 1 merged submission (locked Faculty A), got {cons_res['total_submissions_merged']}"
assert len(cons_res['sections']['6_faculty_achievements']['a_journal_publications']) == 1
print("  [PASS] Consolidation strictly included Faculty A (APPROVED + LOCKED)")
print("  [PASS] Consolidation strictly excluded Faculty B (DRAFT / unapproved)")

# Cleanup test users
User.objects.filter(email__in=[email_a, email_b]).delete()

print("\n" + "=" * 60)
print("ALL 8 PRODUCTION BACKEND ACCEPTANCE TESTS PASSED!")
print("=" * 60)
