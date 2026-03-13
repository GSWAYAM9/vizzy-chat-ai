from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Collection, Media, AITask, SocialShare, UserFollow, ForumPost, ForumReply

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
