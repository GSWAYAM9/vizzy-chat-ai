from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import GenerationParameters, StoryCollection, StorySequence, GeneratedImage
from .serializers import GenerationParametersSerializer, StoryCollectionSerializer, StorySequenceSerializer


class GenerationParametersViewSet(viewsets.ModelViewSet):
    """API endpoints for reusable generation parameters"""
    serializer_class = GenerationParametersSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return parameters for current user"""
        return GenerationParameters.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create parameters for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def defaults(self, request):
        """Get the default generation parameters"""
        default_params = self.get_queryset().filter(is_default=True).first()
        if default_params:
            serializer = self.get_serializer(default_params)
            return Response(serializer.data)
        return Response({'error': 'No default parameters set'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def set_as_default(self, request, pk=None):
        """Set these parameters as default"""
        params = self.get_object()
        # Unset all other defaults
        GenerationParameters.objects.filter(user=request.user).update(is_default=False)
        params.is_default = True
        params.save()
        return Response({'message': 'Set as default'})


class StoryCollectionViewSet(viewsets.ModelViewSet):
    """API endpoints for story collections"""
    serializer_class = StoryCollectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return story collections for current user"""
        return StoryCollection.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create story collection for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_image_to_sequence(self, request, pk=None):
        """Add a generated image to a specific sequence in the story"""
        story = self.get_object()
        image_id = request.data.get('image_id')
        sequence_number = request.data.get('sequence_number')
        narrative_text = request.data.get('narrative_text', '')
        scene_description = request.data.get('scene_description', '')
        
        if not image_id or sequence_number is None:
            return Response(
                {'error': 'image_id and sequence_number required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image = get_object_or_404(GeneratedImage, id=image_id, user=request.user)
        
        # Create or update story sequence
        sequence, created = StorySequence.objects.update_or_create(
            story=story,
            sequence_number=sequence_number,
            defaults={
                'image': image,
                'narrative_text': narrative_text,
                'scene_description': scene_description,
                'generated_prompt': image.prompt
            }
        )
        
        # Update current image count
        story.current_image_count = story.sequences.count()
        story.save()
        
        serializer = StorySequenceSerializer(sequence)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def story_viewer(self, request, pk=None):
        """Get complete story with all sequences for viewing"""
        story = self.get_object()
        serializer = self.get_serializer(story)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_from_theme(self, request):
        """Create a new story collection from a theme"""
        title = request.data.get('title')
        description = request.data.get('description')
        theme = request.data.get('theme')
        target_count = request.data.get('target_image_count', 5)
        
        if not title or not theme:
            return Response(
                {'error': 'title and theme required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        story = StoryCollection.objects.create(
            user=request.user,
            title=title,
            description=description or '',
            theme=theme,
            target_image_count=target_count
        )
        
        # TODO: Call Gemini API to generate story outline and initial prompts
        # For now, just create the empty story
        
        serializer = self.get_serializer(story)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StorySequenceViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoints for viewing story sequences"""
    serializer_class = StorySequenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return sequences for stories owned by current user"""
        return StorySequence.objects.filter(story__user=self.request.user).order_by('sequence_number')
    
    @action(detail=False, methods=['get'])
    def by_story(self, request):
        """Get all sequences for a specific story"""
        story_id = request.query_params.get('story_id')
        if not story_id:
            return Response(
                {'error': 'story_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        story = get_object_or_404(StoryCollection, id=story_id, user=request.user)
        sequences = story.sequences.all().order_by('sequence_number')
        
        serializer = self.get_serializer(sequences, many=True)
        return Response({'results': serializer.data})
