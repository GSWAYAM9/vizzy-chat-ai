import uuid
from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField

class UserProfile(models.Model):
    """Extended user profile with Deckoviz-specific fields"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_id = models.UUIDField(primary_key=False, default=uuid.uuid4, unique=True)
    avatar_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    interests = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    favourite_artists = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    favourite_moods = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    followers_count = models.IntegerField(default=0)
    following_count = models.IntegerField(default=0)
    google_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}"


class Collection(models.Model):
    """User collections for organizing artworks"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    mood = models.CharField(max_length=100, blank=True, default='')
    style = models.CharField(max_length=100, blank=True, default='')
    is_public = models.BooleanField(default=False)
    tags = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    media_count = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    shares_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Media(models.Model):
    """Media items within collections"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='media')
    image_url = models.URLField()
    title = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-added_at']

    def __str__(self):
        return self.title or f"Media {self.id}"


class AITask(models.Model):
    """AI generation tasks with history"""
    TASK_TYPE_CHOICES = [
        ('dream_visualizer', 'Dream Visualizer'),
        ('style_transfer', 'Style Transfer'),
        ('moodboard', 'Moodboard'),
        ('poster', 'Poster Creation'),
        ('brand_assets', 'Brand Assets'),
        ('image_generation', 'Image Generation'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_tasks')
    task_id = models.UUIDField(unique=True, default=uuid.uuid4)
    task_type = models.CharField(max_length=50, choices=TASK_TYPE_CHOICES)
    prompt = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    images = ArrayField(models.URLField(), default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.task_type} - {self.status}"


class SocialShare(models.Model):
    """Track collection sharing"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_collections')
    shared_with = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='collections_shared_with_me')
    share_type = models.CharField(max_length=50, choices=[('user', 'User'), ('public', 'Public'), ('link', 'Link')])
    can_edit = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.collection.title} shared by {self.shared_by.email}"


class UserFollow(models.Model):
    """User follow relationships"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_users')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_users')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.email} follows {self.following.email}"


class ForumPost(models.Model):
    """Forum posts for community discussion"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_posts')
    title = models.CharField(max_length=255)
    content = models.TextField()
    tags = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    likes_count = models.IntegerField(default=0)
    replies_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ForumReply(models.Model):
    """Replies to forum posts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='replies')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_replies')
    content = models.TextField()
    likes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply to {self.post.title}"
