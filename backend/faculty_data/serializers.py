from rest_framework import serializers
from .models import (
    Publication, Patent, Book, FdpTraining,
    Consultancy, Grant, Certification, StudentGuidance, Activity,
    StudentProject, FacultyExpertise, Notification, Badge
)

class BaseActivitySerializer(serializers.ModelSerializer):
    faculty_username = serializers.CharField(source='faculty.username', read_only=True)
    faculty_department = serializers.CharField(source='faculty.department', read_only=True)

    class Meta:
        abstract = True


class PublicationSerializer(BaseActivitySerializer):
    class Meta:
        model = Publication
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class PatentSerializer(BaseActivitySerializer):
    class Meta:
        model = Patent
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class BookSerializer(BaseActivitySerializer):
    class Meta:
        model = Book
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class FdpTrainingSerializer(BaseActivitySerializer):
    class Meta:
        model = FdpTraining
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class ConsultancySerializer(BaseActivitySerializer):
    class Meta:
        model = Consultancy
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class GrantSerializer(BaseActivitySerializer):
    class Meta:
        model = Grant
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class CertificationSerializer(BaseActivitySerializer):
    class Meta:
        model = Certification
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class StudentGuidanceSerializer(BaseActivitySerializer):
    class Meta:
        model = StudentGuidance
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class ActivitySerializer(BaseActivitySerializer):
    class Meta:
        model = Activity
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class StudentProjectSerializer(BaseActivitySerializer):
    class Meta:
        model = StudentProject
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class FacultyExpertiseSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyExpertise
        fields = '__all__'
        read_only_fields = ('faculty',)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('faculty', 'created_at')


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = '__all__'
        read_only_fields = ('faculty', 'awarded_at')

from .models import FacultyGoal, FacultyTimeline, DiscussionPost

class FacultyGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyGoal
        fields = '__all__'
        read_only_fields = ('faculty', 'created_at')

class FacultyTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyTimeline
        fields = '__all__'
        read_only_fields = ('faculty', 'created_at')

class DiscussionPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    class Meta:
        model = DiscussionPost
        fields = '__all__'
        read_only_fields = ('author', 'created_at')

from .models import ResearchAsset, FacultyRole, Certificate

class ResearchAssetSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    class Meta:
        model = ResearchAsset
        fields = '__all__'
        read_only_fields = ('uploaded_by', 'institution', 'downloads', 'created_at')


class FacultyRoleSerializer(BaseActivitySerializer):
    class Meta:
        model = FacultyRole
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')


class CertificateSerializer(BaseActivitySerializer):
    class Meta:
        model = Certificate
        fields = '__all__'
        read_only_fields = ('faculty', 'status', 'created_at', 'updated_at')

