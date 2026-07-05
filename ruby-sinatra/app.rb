require 'sinatra'
require 'json'

set :bind, '0.0.0.0'
set :port, ENV['PORT'] || 3000
# Sinatra 4.x's rack-protection rejects requests whose Host header isn't permitted
# (the Ruby equivalent of Django's ALLOWED_HOSTS). Empty list = allow any host, so
# it works behind Symplax's domain + proxy.
set :host_authorization, { permitted_hosts: [] }

get '/health' do
  content_type :json
  { status: 'ok' }.to_json
end

get '/' do
  content_type :json
  { message: 'Ruby Sinatra running on Symplax', lang: 'ruby' }.to_json
end
