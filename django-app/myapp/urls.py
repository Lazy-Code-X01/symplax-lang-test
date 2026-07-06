from django.urls import path
from django.http import JsonResponse
def home(request): return JsonResponse({'message': 'Django on Symplax, testing auto redeploy', 'status': 'ok'})
urlpatterns = [path('', home), path('health', home)]
