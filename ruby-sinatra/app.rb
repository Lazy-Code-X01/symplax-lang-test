require 'sinatra'
require 'json'

set :bind, '0.0.0.0'
set :port, ENV['PORT'] || 3000

get '/health' do
  content_type :json
  { status: 'ok' }.to_json
end

get '/' do
  content_type :json
  { message: 'Ruby Sinatra running on Symplax', lang: 'ruby' }.to_json
end
