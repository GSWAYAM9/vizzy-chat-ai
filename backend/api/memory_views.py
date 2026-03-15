from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import UserMemory, MemoryEntry, CustomInstruction, PresetStyle
from .serializers import UserMemorySerializer, MemoryEntrySerializer, CustomInstructionSerializer, PresetStyleSerializer


class UserMemoryViewSet(viewsets.ViewSet):
    """API endpoints for user memory management"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_memory(self, request):
        """Get or create user memory"""
        memory, created = UserMemory.objects.get_or_create(user=request.user)
        serializer = UserMemorySerializer(memory)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_memory(self, request):
        """Update user memory preferences"""
        memory, _ = UserMemory.objects.get_or_create(user=request.user)
        
        # Update fields
        if 'favorite_styles' in request.data:
            memory.favorite_styles = request.data['favorite_styles']
        if 'favorite_themes' in request.data:
            memory.favorite_themes = request.data['favorite_themes']
        if 'favorite_moods' in request.data:
            memory.favorite_moods = request.data['favorite_moods']
        if 'creative_values' in request.data:
            memory.creative_values = request.data['creative_values']
        if 'artistic_goals' in request.data:
            memory.artistic_goals = request.data['artistic_goals']
        if 'preferred_quality_level' in request.data:
            memory.preferred_quality_level = request.data['preferred_quality_level']
        if 'preferred_generation_speed' in request.data:
            memory.preferred_generation_speed = request.data['preferred_generation_speed']
        
        memory.save()
        serializer = UserMemorySerializer(memory)
        return Response(serializer.data)


class MemoryEntryViewSet(viewsets.ModelViewSet):
    """API endpoints for memory entries"""
    serializer_class = MemoryEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return memory entries for current user"""
        return MemoryEntry.objects.filter(user_memory__user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create memory entry for current user"""
        memory, _ = UserMemory.objects.get_or_create(user=self.request.user)
        serializer.save(user_memory=memory)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get memory entries filtered by type"""
        entry_type = request.query_params.get('type')
        if not entry_type:
            return Response(
                {'error': 'type parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        entries = self.get_queryset().filter(entry_type=entry_type)
        serializer = self.get_serializer(entries, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get'])
    def high_importance(self, request):
        """Get high importance memory entries"""
        entries = self.get_queryset().filter(importance_level__gte=2)
        serializer = self.get_serializer(entries, many=True)
        return Response({'results': serializer.data})


class CustomInstructionViewSet(viewsets.ModelViewSet):
    """API endpoints for custom instructions"""
    serializer_class = CustomInstructionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return custom instructions for current user"""
        return CustomInstruction.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create instruction for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active custom instructions"""
        instructions = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(instructions, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle instruction active status"""
        instruction = self.get_object()
        instruction.is_active = not instruction.is_active
        instruction.save()
        return Response({'is_active': instruction.is_active})
    
    @action(detail=False, methods=['get'])
    def by_applicable_to(self, request):
        """Get instructions for a specific feature"""
        applicable_to = request.query_params.get('applicable_to')
        if not applicable_to:
            return Response(
                {'error': 'applicable_to parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instructions = self.get_queryset().filter(
            applicable_to__in=[applicable_to, 'all'],
            is_active=True
        )
        serializer = self.get_serializer(instructions, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=True, methods=['post'])
    def use_instruction(self, request, pk=None):
        """Increment usage count"""
        instruction = self.get_object()
        instruction.usage_count += 1
        instruction.save()
        return Response({'usage_count': instruction.usage_count})


class PresetStyleViewSet(viewsets.ModelViewSet):
    """API endpoints for style presets"""
    serializer_class = PresetStyleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return style presets for current user"""
        return PresetStyle.objects.filter(user=self.request.user).order_by('-is_favorite', '-usage_count')
    
    def perform_create(self, serializer):
        """Create preset for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """Get favorite presets"""
        presets = self.get_queryset().filter(is_favorite=True)
        serializer = self.get_serializer(presets, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle favorite status"""
        preset = self.get_object()
        preset.is_favorite = not preset.is_favorite
        preset.save()
        return Response({'is_favorite': preset.is_favorite})
    
    @action(detail=True, methods=['post'])
    def use_preset(self, request, pk=None):
        """Use this preset (increments counter)"""
        preset = self.get_object()
        preset.usage_count += 1
        preset.save()
        return Response({'usage_count': preset.usage_count})
    
    @action(detail=False, methods=['get'])
    def most_used(self, request):
        """Get most used presets"""
        limit = int(request.query_params.get('limit', 5))
        presets = self.get_queryset()[:limit]
        serializer = self.get_serializer(presets, many=True)
        return Response({'results': serializer.data})
