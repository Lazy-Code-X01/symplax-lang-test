import os
SECRET_KEY = os.environ.get('SECRET_KEY', 'symplax-test-secret-key')
DEBUG = False
ALLOWED_HOSTS = ['*']
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Zero-config sqlite so the app deploys without any DB env vars. A real app would
# point ENGINE/NAME at Postgres/MySQL via env (e.g. DATABASE_URL).
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}
INSTALLED_APPS = ['django.contrib.contenttypes', 'django.contrib.staticfiles']
ROOT_URLCONF = 'myapp.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [], 'APP_DIRS': True, 'OPTIONS': {'context_processors': []}}]
WSGI_APPLICATION = 'myapp.wsgi.application'
STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
