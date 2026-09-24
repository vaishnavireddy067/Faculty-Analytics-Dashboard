from django.db import models
from core.models import User

class BaseActivityModel(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    faculty = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    proof_document = models.FileField(upload_to='proofs/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Publication(BaseActivityModel):
    INDEXING_CHOICES = (
        ('SCOPUS', 'Scopus'),
        ('SCI', 'SCI'),
        ('WOS', 'Web of Science'),
        ('UGC_CARE', 'UGC CARE'),
        ('OTHER', 'Other'),
    )
    title = models.CharField(max_length=500)
    journal_name = models.CharField(max_length=255)
    indexing = models.CharField(max_length=50, choices=INDEXING_CHOICES, default='OTHER')
    year = models.IntegerField()
    authors = models.CharField(max_length=255, help_text="Comma separated list of authors")
    doi = models.CharField(max_length=255, blank=True, null=True, help_text="DOI Link")
    pages = models.CharField(max_length=50, blank=True, null=True, help_text="e.g., 102-110")
    issn_isbn = models.CharField(max_length=100, blank=True, null=True, help_text="ISSN/ISBN Number")
    api_score = models.FloatField(default=0.0)

    def save(self, *args, **kwargs):
        # Calculate API score based on indexing
        if self.indexing == 'SCI':
            self.api_score = 30.0
        elif self.indexing in ['SCOPUS', 'WOS']:
            self.api_score = 20.0
        elif self.indexing == 'UGC_CARE':
            self.api_score = 10.0
        else:
            self.api_score = 5.0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.faculty.username}"


class Patent(BaseActivityModel):
    PATENT_STATUS_CHOICES = (
        ('FILED', 'Filed'),
        ('PUBLISHED', 'Published'),
        ('GRANTED', 'Granted'),
    )
    title = models.CharField(max_length=500)
    application_number = models.CharField(max_length=100, blank=True, null=True)
    patent_status = models.CharField(max_length=50, choices=PATENT_STATUS_CHOICES, default='FILED')
    year = models.IntegerField()
    api_score = models.FloatField(default=0.0)

    def save(self, *args, **kwargs):
        if self.patent_status == 'GRANTED':
            self.api_score = 30.0
        elif self.patent_status == 'PUBLISHED':
            self.api_score = 20.0
        else:
            self.api_score = 10.0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Patent: {self.title}"


class Book(BaseActivityModel):
    title = models.CharField(max_length=500)
    publisher = models.CharField(max_length=255)
    isbn = models.CharField(max_length=50, blank=True, null=True)
    year = models.IntegerField()
    is_chapter = models.BooleanField(default=False)
    api_score = models.FloatField(default=0.0)

    def save(self, *args, **kwargs):
        if self.is_chapter:
            self.api_score = 5.0
        else:
            self.api_score = 20.0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Book/Chapter: {self.title}"


class FdpTraining(BaseActivityModel):
    ROLE_CHOICES = (
        ('PARTICIPANT', 'Participant'),
        ('RESOURCE_PERSON', 'Resource Person'),
        ('ORGANIZER', 'Organizer'),
    )
    title = models.CharField(max_length=500)
    organization = models.CharField(max_length=255)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='PARTICIPANT')
    start_date = models.DateField()
    end_date = models.DateField()
    duration_days = models.IntegerField(default=1)

    def __str__(self):
        return f"FDP: {self.title}"


class Consultancy(BaseActivityModel):
    project_title = models.CharField(max_length=500)
    client_organization = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    year = models.IntegerField()
    api_score = models.FloatField(default=0.0)

    def save(self, *args, **kwargs):
        # 5 points for every 1 Lakh (100,000)
        lakhs = float(self.amount) / 100000.0
        self.api_score = round(lakhs * 5.0, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Consultancy: {self.project_title}"


class Grant(BaseActivityModel):
    project_title = models.CharField(max_length=500)
    funding_agency = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    year = models.IntegerField()
    api_score = models.FloatField(default=0.0)

    def save(self, *args, **kwargs):
        # 5 points for every 1 Lakh (100,000)
        lakhs = float(self.amount) / 100000.0
        self.api_score = round(lakhs * 5.0, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Grant: {self.project_title}"


class Certification(BaseActivityModel):
    name = models.CharField(max_length=255)
    issuing_authority = models.CharField(max_length=255)
    year = models.IntegerField()

    def __str__(self):
        return f"Cert: {self.name}"


class StudentGuidance(BaseActivityModel):
    LEVEL_CHOICES = (
        ('UG', 'Undergraduate (B.Tech)'),
        ('PG', 'Postgraduate (M.Tech/MBA)'),
        ('PHD', 'Ph.D.'),
    )
    project_title = models.CharField(max_length=500)
    student_level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='UG')
    year = models.IntegerField()

    def __str__(self):
        return f"Guidance: {self.project_title}"


class Activity(BaseActivityModel):
    CATEGORY_CHOICES = (
        ('GUEST_LECTURE', 'Guest Lecture'),
        ('INDUSTRIAL_VISIT', 'Industrial Visit'),
        ('AWARD', 'Award/Recognition'),
        ('OTHER', 'Other'),
    )
    title = models.CharField(max_length=500)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='OTHER')
    organization = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField()

    def __str__(self):
        return f"Activity: {self.title}"


class StudentProject(BaseActivityModel):
    STATUS_CHOICES = (
        ('ONGOING', 'Ongoing'),
        ('COMPLETED', 'Completed'),
    )
    title = models.CharField(max_length=500)
    project_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ONGOING')
    publications_count = models.IntegerField(default=0)
    year = models.IntegerField()

    def __str__(self):
        return f"Student Project: {self.title}"


class FacultyExpertise(models.Model):
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expertise')
    skill_name = models.CharField(max_length=255)
    proficiency_percentage = models.IntegerField(default=50)

    def __str__(self):
        return f"{self.skill_name} ({self.proficiency_percentage}%) - {self.faculty.username}"


class Notification(models.Model):
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.faculty.username}: {self.title}"


class Badge(models.Model):
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    name = models.CharField(max_length=255)
    icon_name = models.CharField(max_length=100) # e.g., 'Trophy', 'Medal' for UI icons
    description = models.TextField()
    awarded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Badge: {self.name} - {self.faculty.username}"


class StudentFeedback(models.Model):
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.FloatField()
    comments = models.TextField(blank=True, null=True)
    is_anonymous = models.BooleanField(default=True)
    sentiment_summary = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.faculty.username}: {self.rating} Stars"


class AccreditationDeadline(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_deadlines')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Deadline: {self.title} due {self.due_date}"


class AuditLog(models.Model):
    action = models.CharField(max_length=255)
    target_activity = models.CharField(max_length=255) # e.g. "Publication - AI paper"
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.performed_by.username} {self.action} {self.target_activity}"

class FacultyGoal(models.Model):
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    year = models.IntegerField(default=2026)
    title = models.CharField(max_length=255) # e.g., "Target Publications"
    target = models.IntegerField()
    completed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Goal: {self.title} for {self.faculty.username}"

class FacultyTimeline(models.Model):
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='timeline')
    year = models.IntegerField()
    event_title = models.CharField(max_length=255) # e.g., "Joined Institution", "Patent Granted"
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-year']

    def __str__(self):
        return f"{self.year} - {self.event_title} ({self.faculty.username})"

class DiscussionPost(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_posts')
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=100, default='General') # e.g., 'Call for Papers', 'Research Ideas'
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.author.username}"

class ResearchAsset(models.Model):
    ASSET_TYPES = (
        ('DATASET', 'Dataset'),
        ('CODE', 'Source Code'),
        ('PREPRINT', 'Pre-print Paper'),
        ('PRESENTATION', 'Presentation/Slides'),
        ('OTHER', 'Other'),
    )
    title = models.CharField(max_length=500)
    description = models.TextField()
    asset_type = models.CharField(max_length=50, choices=ASSET_TYPES, default='OTHER')
    file = models.FileField(upload_to='research_assets/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_assets')
    institution = models.ForeignKey('core.Institution', on_delete=models.CASCADE, null=True, blank=True)
    is_public = models.BooleanField(default=True, help_text="Visible across the institution")
    downloads = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class FacultyProfile(models.Model):
    faculty = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=(('MALE', 'Male'), ('FEMALE', 'Female'), ('OTHER', 'Other')), blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    aadhar_number = models.CharField(max_length=20, blank=True, null=True)
    pan_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_joining = models.DateField(blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Assistant Professor")
    aicte_id = models.CharField(max_length=100, blank=True, null=True)
    jntuh_id = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Profile: {self.faculty.username}"

class EducationQualification(models.Model):
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='education_qualifications')
    degree = models.CharField(max_length=100, help_text="e.g., B.Tech, M.Tech, Ph.D")
    specialization = models.CharField(max_length=255, help_text="e.g., Computer Science and Engineering")
    university = models.CharField(max_length=255, help_text="Institute or University Name")
    year_of_passing = models.IntegerField()
    percentage_cgpa = models.CharField(max_length=50)

    class Meta:
        ordering = ['-year_of_passing']

    def __str__(self):
        return f"{self.degree} in {self.specialization} - {self.faculty.username}"

class WorkExperience(models.Model):
    EXP_TYPE_CHOICES = (
        ('TEACHING', 'Teaching'),
        ('INDUSTRY', 'Industry'),
        ('RESEARCH', 'Research'),
    )
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='work_experiences')
    organization = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True, help_text="Leave blank if currently working here")
    experience_type = models.CharField(max_length=50, choices=EXP_TYPE_CHOICES, default='TEACHING')

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.designation} at {self.organization} - {self.faculty.username}"


class FacultyRole(BaseActivityModel):
    role_name = models.CharField(max_length=255, help_text="e.g. Exam Coordinator, NSS Coordinator, IQAC Coordinator")
    academic_year = models.CharField(max_length=50, default="2025-26")
    department = models.CharField(max_length=100, blank=True, null=True)
    from_date = models.DateField(blank=True, null=True)
    to_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.role_name} ({self.academic_year}) - {self.faculty.username}"


class Certificate(BaseActivityModel):
    CATEGORY_CHOICES = (
        ('FDP', 'FDP Certificate'),
        ('WORKSHOP', 'Workshop Certificate'),
        ('STTP', 'STTP Certificate'),
        ('SEMINAR', 'Seminar Certificate'),
        ('CONFERENCE', 'Conference Certificate'),
        ('TRAINING', 'Training Certificate'),
        ('AWARD', 'Award & Recognition Certificate'),
        ('CONSULTANCY', 'Consultancy Proof'),
        ('PATENT', 'Patent Document'),
        ('PUBLICATION', 'Publication Proof'),
        ('OTHER', 'Other Academic Certificate'),
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='FDP')
    issue_date = models.DateField(blank=True, null=True)
    issuing_organization = models.CharField(max_length=255, blank=True, null=True)
    academic_year = models.CharField(max_length=50, default="2025-26")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Certificate: {self.title} ({self.category}) - {self.faculty.username}"


class IQACReport(models.Model):
    department = models.CharField(max_length=255, default="Computer Science & Engineering (Data Science) and AI&DS")
    month = models.CharField(max_length=50, default="AUGUST")
    year = models.CharField(max_length=20, default="2025")
    academic_year = models.CharField(max_length=50, default="2025-26")
    institution_name = models.CharField(max_length=255, default="AVN INSTITUTE OF ENGINEERING & TECHNOLOGY")
    accreditation_details = models.CharField(max_length=255, default="Accredited by NAAC & NBA | An Autonomous Institute Affiliated to JNTU Hyderabad")
    sections_data = models.JSONField(default=dict, help_text="Stores all 12 sections and customized tables")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='iqac_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ('department', 'month', 'year')

    def __str__(self):
        return f"IQAC Report - {self.department} ({self.month} {self.year})"


