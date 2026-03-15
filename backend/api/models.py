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



class GeneratedImage(models.Model):
    """Store all generated images with metadata"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_images')
    image_url = models.URLField()
    thumbnail_url = models.URLField(blank=True, null=True)
    prompt = models.TextField()
    negative_prompt = models.TextField(blank=True, default='')
    aspect_ratio = models.CharField(max_length=20, default='1:1')
    seed = models.IntegerField(null=True, blank=True)
    model = models.CharField(max_length=100, default='runware')
    generation_time = models.FloatField(null=True, blank=True)
    likes_count = models.IntegerField(default=0)
    is_favorited = models.BooleanField(default=False)
    ai_task = models.ForeignKey(AITask, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_images')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_favorited', '-created_at']),
        ]

    def __str__(self):
        return f"Image {self.id} by {self.user.email}"


class ImageFeedback(models.Model):
    """AI-generated feedback/critique on generated images"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    image = models.OneToOneField(GeneratedImage, on_delete=models.CASCADE, related_name='feedback')
    composition_score = models.FloatField(default=0)
    color_harmony_score = models.FloatField(default=0)
    creativity_score = models.FloatField(default=0)
    overall_score = models.FloatField(default=0)
    critique = models.TextField(default='')
    strengths = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    areas_for_improvement = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    suggestions = ArrayField(models.CharField(max_length=500), default=list, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"Feedback for {self.image.id}"


class GalleryCollection(models.Model):
    """Collections for organizing generated images"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gallery_collections')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    cover_image = models.ForeignKey(GeneratedImage, on_delete=models.SET_NULL, null=True, blank=True)
    is_public = models.BooleanField(default=False)
    tags = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'name')

    def __str__(self):
        return f"{self.name} by {self.user.email}"


class GalleryImage(models.Model):
    """Many-to-many relationship between GeneratedImage and GalleryCollection"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    collection = models.ForeignKey(GalleryCollection, on_delete=models.CASCADE, related_name='images')
    image = models.ForeignKey(GeneratedImage, on_delete=models.CASCADE, related_name='gallery_collections')
    order = models.IntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('collection', 'image')
        ordering = ['order']

    def __str__(self):
        return f"{self.image.id} in {self.collection.name}"


class RefinementHistory(models.Model):
    """Track iterative refinement conversations for images"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    original_image = models.ForeignKey(GeneratedImage, on_delete=models.CASCADE, related_name='refinements')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refinement_histories')
    refinement_number = models.IntegerField(default=1)
    user_feedback = models.TextField()
    ai_suggestion = models.TextField()
    refined_image = models.ForeignKey(
        GeneratedImage, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='refined_from'
    )
    refined_prompt = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['refinement_number']
        indexes = [
            models.Index(fields=['original_image', 'refinement_number']),
        ]

    def __str__(self):
        return f"Refinement {self.refinement_number} of {self.original_image.id}"


class IdeaSuggestion(models.Model):
    """AI-generated creative direction suggestions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='idea_suggestions')
    based_on_image = models.ForeignKey(GeneratedImage, on_delete=models.SET_NULL, null=True, blank=True)
    suggestion_type = models.CharField(max_length=50, choices=[
        ('style', 'Style Variation'),
        ('composition', 'Composition Change'),
        ('mood', 'Mood Direction'),
        ('theme', 'Theme Exploration'),
        ('technique', 'Technique Suggestion'),
    ])
    title = models.CharField(max_length=255)
    description = models.TextField()
    suggested_prompt = models.TextField()
    confidence_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-confidence_score', '-created_at']

    def __str__(self):
        return f"{self.suggestion_type}: {self.title}"


class DeepPrompt(models.Model):
    """Sophisticated detailed prompts with multiple components"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deep_prompts')
    base_prompt = models.TextField()
    style_descriptor = models.TextField()
    composition_notes = models.TextField()
    mood_atmosphere = models.TextField()
    technical_details = models.TextField()
    quality_modifiers = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    generated_full_prompt = models.TextField()
    is_template = models.BooleanField(default=False)
    usage_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Deep Prompt: {self.base_prompt[:50]}"


class GenerationParameters(models.Model):
    """Parameters used for image generation (style, size, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generation_parameters')
    name = models.CharField(max_length=255)
    aspect_ratio = models.CharField(max_length=20, default='1:1')
    style = models.CharField(max_length=255, blank=True, default='')
    mood = models.CharField(max_length=255, blank=True, default='')
    quality_level = models.CharField(max_length=50, choices=[
        ('draft', 'Draft'),
        ('standard', 'Standard'),
        ('high', 'High Quality'),
        ('ultra', 'Ultra Quality'),
    ], default='standard')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.aspect_ratio})"


class StoryCollection(models.Model):
    """Collections of related images that tell a story"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_collections')
    title = models.CharField(max_length=255)
    description = models.TextField()
    theme = models.CharField(max_length=255)
    target_image_count = models.IntegerField(default=5)
    current_image_count = models.IntegerField(default=0)
    is_public = models.BooleanField(default=False)
    cover_image = models.ForeignKey(GeneratedImage, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class StorySequence(models.Model):
    """Individual images in a story with narrative context"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    story = models.ForeignKey(StoryCollection, on_delete=models.CASCADE, related_name='sequences')
    image = models.ForeignKey(GeneratedImage, on_delete=models.CASCADE)
    sequence_number = models.IntegerField()
    narrative_text = models.TextField()
    scene_description = models.TextField()
    generated_prompt = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['sequence_number']
        unique_together = ('story', 'sequence_number')

    def __str__(self):
        return f"Scene {self.sequence_number} of {self.story.title}"


class UserMemory(models.Model):
    """Store user's creative preferences, values, and goals"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='memory')
    
    # Personal preferences
    favorite_styles = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    favorite_themes = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    favorite_moods = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    preferred_aspect_ratios = ArrayField(models.CharField(max_length=20), default=list, blank=True)
    
    # Creative values and goals
    creative_values = models.TextField(blank=True, default='')
    artistic_goals = models.TextField(blank=True, default='')
    inspiration_sources = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    
    # Quality preferences
    preferred_quality_level = models.CharField(max_length=50, choices=[
        ('draft', 'Draft'),
        ('standard', 'Standard'),
        ('high', 'High Quality'),
        ('ultra', 'Ultra Quality'),
    ], default='standard')
    
    # Workflow preferences
    preferred_generation_speed = models.CharField(max_length=50, choices=[
        ('fast', 'Fast'),
        ('balanced', 'Balanced'),
        ('quality', 'Quality'),
    ], default='balanced')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "User Memories"

    def __str__(self):
        return f"Memory for {self.user.email}"


class MemoryEntry(models.Model):
    """Individual memory entries tracking user's creative journey"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_memory = models.ForeignKey(UserMemory, on_delete=models.CASCADE, related_name='entries')
    entry_type = models.CharField(max_length=50, choices=[
        ('preference', 'Preference Update'),
        ('achievement', 'Creative Achievement'),
        ('learning', 'Learning Note'),
        ('inspiration', 'Inspiration'),
        ('feedback', 'User Feedback'),
    ])
    title = models.CharField(max_length=255)
    content = models.TextField()
    related_image = models.ForeignKey(GeneratedImage, on_delete=models.SET_NULL, null=True, blank=True)
    tags = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    importance_level = models.IntegerField(choices=[(1, 'Low'), (2, 'Medium'), (3, 'High')])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.entry_type}: {self.title}"


class CustomInstruction(models.Model):
    """User-defined custom instructions for the AI"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_instructions')
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    system_instruction = models.TextField()
    
    # What this instruction applies to
    applicable_to = models.CharField(max_length=100, choices=[
        ('generation', 'Image Generation'),
        ('feedback', 'Feedback & Critique'),
        ('suggestions', 'Suggestions'),
        ('refinement', 'Refinement'),
        ('all', 'All Features'),
    ])
    
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.applicable_to})"


class PresetStyle(models.Model):
    """User-created style presets combining multiple parameters"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='preset_styles')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    
    # Style components
    style_descriptor = models.TextField()
    mood_atmosphere = models.TextField()
    composition_guidelines = models.TextField()
    quality_modifiers = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    
    # Usage
    usage_count = models.IntegerField(default=0)
    is_favorite = models.BooleanField(default=False)
    
    # Example images
    example_images = ArrayField(models.URLField(), default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_favorite', '-usage_count', '-created_at']

    def __str__(self):
        return f"Preset: {self.name}"
