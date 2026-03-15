from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import RefinementHistory, IdeaSuggestion, DeepPrompt, GeneratedImage
from .serializers import RefinementHistorySerializer, IdeaSuggestionSerializer, DeepPromptSerializer


class RefinementViewSet(viewsets.ViewSet):
    """API endpoints for iterative image refinement"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def create_refinement(self, request):
        """Submit user feedback to refine an image"""
        image_id = request.data.get('image_id')
        user_feedback = request.data.get('user_feedback')
        
        if not image_id or not user_feedback:
            return Response(
                {'error': 'image_id and user_feedback required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image = get_object_or_404(GeneratedImage, id=image_id, user=request.user)
        
        # Get the refinement number
        refinement_number = RefinementHistory.objects.filter(
            original_image=image
        ).count() + 1
        
        # TODO: Call Gemini API to generate AI suggestion and refined prompt
        # For now, create placeholder refinement
        refinement = RefinementHistory.objects.create(
            original_image=image,
            user=request.user,
            refinement_number=refinement_number,
            user_feedback=user_feedback,
            ai_suggestion="AI suggestion placeholder",
            refined_prompt="Refined prompt placeholder"
        )
        
        serializer = RefinementHistorySerializer(refinement)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def refinement_history(self, request):
        """Get refinement history for an image"""
        image_id = request.query_params.get('image_id')
        
        if not image_id:
            return Response(
                {'error': 'image_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image = get_object_or_404(GeneratedImage, id=image_id, user=request.user)
        refinements = RefinementHistory.objects.filter(original_image=image).order_by('refinement_number')
        
        serializer = RefinementHistorySerializer(refinements, many=True)
        return Response({'results': serializer.data})


class IdeaSuggestionViewSet(viewsets.ViewSet):
    """API endpoints for creative idea suggestions"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def generate_suggestions(self, request):
        """Generate creative suggestions for an image"""
        image_id = request.data.get('image_id')
        
        if not image_id:
            return Response(
                {'error': 'image_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image = get_object_or_404(GeneratedImage, id=image_id, user=request.user)
        
        # TODO: Call Gemini API to generate creative suggestions
        # For now, create placeholder suggestions
        suggestion_types = ['style', 'composition', 'mood', 'theme', 'technique']
        suggestions = []
        
        for i, suggestion_type in enumerate(suggestion_types):
            suggestion = IdeaSuggestion.objects.create(
                user=request.user,
                based_on_image=image,
                suggestion_type=suggestion_type,
                title=f"Suggestion: {suggestion_type.title()}",
                description=f"Consider trying a different {suggestion_type} approach",
                suggested_prompt=f"Modified prompt with {suggestion_type}",
                confidence_score=0.8 - (i * 0.1)
            )
            suggestions.append(suggestion)
        
        serializer = IdeaSuggestionSerializer(suggestions, many=True)
        return Response({'results': serializer.data}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def list_suggestions(self, request):
        """Get suggestions for an image"""
        image_id = request.query_params.get('image_id')
        
        if not image_id:
            return Response(
                {'error': 'image_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image = get_object_or_404(GeneratedImage, id=image_id, user=request.user)
        suggestions = IdeaSuggestion.objects.filter(based_on_image=image).order_by('-confidence_score')
        
        serializer = IdeaSuggestionSerializer(suggestions, many=True)
        return Response({'results': serializer.data})


class DeepPromptViewSet(viewsets.ModelViewSet):
    """API endpoints for sophisticated prompt generation"""
    serializer_class = DeepPromptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return prompts for current user"""
        return DeepPrompt.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create prompt for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate full prompt from components"""
        base_prompt = request.data.get('base_prompt', '')
        style_descriptor = request.data.get('style_descriptor', '')
        composition_notes = request.data.get('composition_notes', '')
        mood_atmosphere = request.data.get('mood_atmosphere', '')
        technical_details = request.data.get('technical_details', '')
        quality_modifiers = request.data.get('quality_modifiers', [])
        
        # Build the full prompt by combining components
        prompt_parts = [base_prompt]
        
        if style_descriptor:
            prompt_parts.append(f"Art style: {style_descriptor}")
        
        if composition_notes:
            prompt_parts.append(f"Composition: {composition_notes}")
        
        if mood_atmosphere:
            prompt_parts.append(f"Mood: {mood_atmosphere}")
        
        if technical_details:
            prompt_parts.append(f"Technical: {technical_details}")
        
        if quality_modifiers:
            prompt_parts.append(", ".join(quality_modifiers))
        
        generated_full_prompt = ", ".join([p for p in prompt_parts if p])
        
        # Create and save the deep prompt
        deep_prompt = DeepPrompt.objects.create(
            user=request.user,
            base_prompt=base_prompt,
            style_descriptor=style_descriptor,
            composition_notes=composition_notes,
            mood_atmosphere=mood_atmosphere,
            technical_details=technical_details,
            quality_modifiers=quality_modifiers,
            generated_full_prompt=generated_full_prompt
        )
        
        serializer = self.get_serializer(deep_prompt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def use_prompt(self, request, pk=None):
        """Increment usage count when prompt is used"""
        prompt = self.get_object()
        prompt.usage_count += 1
        prompt.save()
        return Response({'usage_count': prompt.usage_count})
