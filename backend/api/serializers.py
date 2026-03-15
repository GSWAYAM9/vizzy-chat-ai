from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Collection, Media, AITask, SocialShare, UserFollow, 
    ForumPost, ForumReply, GeneratedImage, ImageFeedback, GalleryCollection, GalleryImage,
    RefinementHistory, IdeaSuggestion, DeepPrompt, GenerationParameters, StoryCollection, StorySequence,
    UserMemory, MemoryEntry, CustomInstruction, PresetStyle
)

class UserProfileSerializer(serializers.ModelSerializer):
    """Serialize user profile information"""
    email = serializers.CharField(source='user.email', read_only=True)
    name = serializers.CharField(source='user.first_name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'user_id', 'email', 'name', 'avatar_url', 'bio', 'location',
            'interests', 'favourite_artists', 'favourite_moods',
            'followers_count', 'following_count', 'created_at'
        ]
        read_only_fields = ['user_id', 'followers_count', 'following_count', 'created_at']


class MediaSerializer(serializers.ModelSerializer):
    """Serialize media items"""
    class Meta:
        model = Media
        fields = ['id', 'image_url', 'title', 'description', 'created_at']


class CollectionSerializer(serializers.ModelSerializer):
    """Serialize collection data"""
    media = MediaSerializer(many=True, read_only=True, source='media.all')
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    
    class Meta:
        model = Collection
        fields = [
            'id', 'user_name', 'title', 'description', 'mood', 'style',
            'is_public', 'tags', 'media_count', 'likes_count', 'shares_count',
            'media', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'media_count', 'likes_count', 'shares_count', 'created_at', 'updated_at']


class AITaskSerializer(serializers.ModelSerializer):
    """Serialize AI task results"""
    class Meta:
        model = AITask
        fields = [
            'id', 'task_id', 'task_type', 'prompt', 'status',
            'images', 'metadata', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'task_id', 'status', 'images', 'completed_at']


class SocialShareSerializer(serializers.ModelSerializer):
    """Serialize collection shares"""
    shared_by_email = serializers.CharField(source='shared_by.email', read_only=True)
    collection_title = serializers.CharField(source='collection.title', read_only=True)
    
    class Meta:
        model = SocialShare
        fields = [
            'id', 'collection_title', 'shared_by_email', 'share_type',
            'can_edit', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class UserFollowSerializer(serializers.ModelSerializer):
    """Serialize user follow relationships"""
    follower_name = serializers.CharField(source='follower.first_name', read_only=True)
    following_name = serializers.CharField(source='following.first_name', read_only=True)
    following_email = serializers.CharField(source='following.email', read_only=True)
    
    class Meta:
        model = UserFollow
        fields = ['id', 'follower_name', 'following_name', 'following_email', 'created_at']
        read_only_fields = ['id', 'created_at']


class ForumReplySerializer(serializers.ModelSerializer):
    """Serialize forum replies"""
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    user_avatar = serializers.CharField(source='user.profile.avatar_url', read_only=True)
    
    class Meta:
        model = ForumReply
        fields = ['id', 'user_name', 'user_avatar', 'content', 'likes_count', 'created_at']
        read_only_fields = ['id', 'likes_count', 'created_at']


class ForumPostSerializer(serializers.ModelSerializer):
    """Serialize forum posts"""
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    user_avatar = serializers.CharField(source='user.profile.avatar_url', read_only=True)
    replies = ForumReplySerializer(many=True, read_only=True)
    
    class Meta:
        model = ForumPost
        fields = [
            'id', 'user_name', 'user_avatar', 'title', 'content', 'tags',
            'likes_count', 'replies_count', 'replies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'likes_count', 'replies_count', 'created_at', 'updated_at']


class GeneratedImageSerializer(serializers.ModelSerializer):
    """Serialize generated images with metadata"""
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    
    class Meta:
        model = GeneratedImage
        fields = [
            'id', 'user_name', 'image_url', 'thumbnail_url', 'prompt', 'negative_prompt',
            'aspect_ratio', 'seed', 'model', 'generation_time', 'likes_count',
            'is_favorited', 'created_at'
        ]
        read_only_fields = ['id', 'user_name', 'thumbnail_url', 'likes_count', 'created_at']


class ImageFeedbackSerializer(serializers.ModelSerializer):
    """Serialize AI-generated feedback for images"""
    image_url = serializers.CharField(source='image.image_url', read_only=True)
    
    class Meta:
        model = ImageFeedback
        fields = [
            'id', 'image_url', 'composition_score', 'color_harmony_score',
            'creativity_score', 'overall_score', 'critique', 'strengths',
            'areas_for_improvement', 'suggestions', 'generated_at'
        ]
        read_only_fields = fields


class GalleryImageSerializer(serializers.ModelSerializer):
    """Serialize images within a gallery collection"""
    image_url = serializers.CharField(source='image.image_url', read_only=True)
    image_id = serializers.UUIDField(source='image.id', read_only=True)
    prompt = serializers.CharField(source='image.prompt', read_only=True)
    
    class Meta:
        model = GalleryImage
        fields = ['id', 'image_id', 'image_url', 'prompt', 'order', 'added_at']
        read_only_fields = ['id', 'added_at']


class GalleryCollectionSerializer(serializers.ModelSerializer):
    """Serialize gallery collections"""
    images = GalleryImageSerializer(many=True, read_only=True)
    cover_image_url = serializers.CharField(source='cover_image.image_url', read_only=True, allow_null=True)
    image_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GalleryCollection
        fields = [
            'id', 'name', 'description', 'cover_image_url', 'is_public',
            'tags', 'image_count', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'image_count', 'created_at', 'updated_at']
    
    def get_image_count(self, obj):
        return obj.images.count()


class RefinementHistorySerializer(serializers.ModelSerializer):
    """Serialize iterative refinement conversations"""
    original_image_url = serializers.CharField(source='original_image.image_url', read_only=True)
    refined_image_url = serializers.CharField(source='refined_image.image_url', read_only=True, allow_null=True)
    
    class Meta:
        model = RefinementHistory
        fields = [
            'id', 'refinement_number', 'user_feedback', 'ai_suggestion',
            'refined_prompt', 'original_image_url', 'refined_image_url', 'created_at'
        ]
        read_only_fields = ['id', 'refinement_number', 'ai_suggestion', 'created_at']


class IdeaSuggestionSerializer(serializers.ModelSerializer):
    """Serialize creative direction suggestions"""
    class Meta:
        model = IdeaSuggestion
        fields = [
            'id', 'suggestion_type', 'title', 'description',
            'suggested_prompt', 'confidence_score', 'created_at'
        ]
        read_only_fields = fields


class DeepPromptSerializer(serializers.ModelSerializer):
    """Serialize sophisticated detailed prompts"""
    class Meta:
        model = DeepPrompt
        fields = [
            'id', 'base_prompt', 'style_descriptor', 'composition_notes',
            'mood_atmosphere', 'technical_details', 'quality_modifiers',
            'generated_full_prompt', 'is_template', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'generated_full_prompt', 'usage_count', 'created_at', 'updated_at']


class GenerationParametersSerializer(serializers.ModelSerializer):
    """Serialize generation parameters (reusable settings)"""
    class Meta:
        model = GenerationParameters
        fields = [
            'id', 'name', 'aspect_ratio', 'style', 'mood', 'quality_level', 'is_default', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StorySequenceSerializer(serializers.ModelSerializer):
    """Serialize individual story sequences"""
    image_url = serializers.CharField(source='image.image_url', read_only=True)
    
    class Meta:
        model = StorySequence
        fields = [
            'id', 'sequence_number', 'narrative_text', 'scene_description',
            'generated_prompt', 'image_url', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StoryCollectionSerializer(serializers.ModelSerializer):
    """Serialize story collections"""
    sequences = StorySequenceSerializer(many=True, read_only=True)
    cover_image_url = serializers.CharField(source='cover_image.image_url', read_only=True, allow_null=True)
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = StoryCollection
        fields = [
            'id', 'title', 'description', 'theme', 'target_image_count',
            'current_image_count', 'completion_percentage', 'is_public',
            'cover_image_url', 'sequences', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_image_count', 'completion_percentage', 'created_at', 'updated_at']
    
    def get_completion_percentage(self, obj):
        if obj.target_image_count == 0:
            return 0
        return int((obj.current_image_count / obj.target_image_count) * 100)


class MemoryEntrySerializer(serializers.ModelSerializer):
    """Serialize memory entries"""
    image_url = serializers.CharField(source='related_image.image_url', read_only=True, allow_null=True)
    
    class Meta:
        model = MemoryEntry
        fields = [
            'id', 'entry_type', 'title', 'content', 'image_url',
            'tags', 'importance_level', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class UserMemorySerializer(serializers.ModelSerializer):
    """Serialize user memory with all preferences"""
    entries = MemoryEntrySerializer(many=True, read_only=True, source='entries')
    
    class Meta:
        model = UserMemory
        fields = [
            'id', 'favorite_styles', 'favorite_themes', 'favorite_moods',
            'preferred_aspect_ratios', 'creative_values', 'artistic_goals',
            'inspiration_sources', 'preferred_quality_level', 'preferred_generation_speed',
            'entries', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomInstructionSerializer(serializers.ModelSerializer):
    """Serialize custom instructions"""
    class Meta:
        model = CustomInstruction
        fields = [
            'id', 'name', 'description', 'system_instruction',
            'applicable_to', 'is_active', 'usage_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class PresetStyleSerializer(serializers.ModelSerializer):
    """Serialize style presets"""
    class Meta:
        model = PresetStyle
        fields = [
            'id', 'name', 'description', 'style_descriptor', 'mood_atmosphere',
            'composition_guidelines', 'quality_modifiers', 'usage_count',
            'is_favorite', 'example_images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']
