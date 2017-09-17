class AppController < ApplicationController
  skip_before_action :verify_authenticity_token
  include Authorizer
  before_action :tapp_admin, only: [:tapp]
  before_action :cp_access, only: [:cp]
  before_action :app_access, only: [:roles]
  before_action :correct_applicant, only: [:student_view, :ddah_view]
  before_action :cp_admin, only: [:test]

  ''' TAPP functions '''
  def tapp
    render :tapp , layout: false
  end

  ''' CP functions '''
  def cp
    render :cp, layout: false
  end

  def roles
    if ENV['RAILS_ENV'] == 'production'
      render json: {development: false, utorid: session[:utorid], roles: session[:roles]}
    else
      render json: {development: true, utorid: "development", roles: session[:roles]}
    end
  end

  def student_view
    offer = Offer.find(params[:offer_id])
    if offer
      if offer[:send_date]
        @offer = offer.format.merge({mangled: offer[:link]})
        render :decision, layout: false
      else
        render status: 404, json: {message: "Offer #{offer[:id]} hasn't been sent."}
      end
    else
      render status: 404, json: {message: "There is no such page."}
    end
  end

  def ddah_view
    ddah = Ddah.find_by(offer_id: params[:offer_id])
    if ddah
      offer = Offer.find(params[:offer_id])
      if offer[:ddah_status]== "Pending" || offer[:ddah_status]== "Accepted"
        @ddah = ddah.format
        @offer = offer.format
        render :ddah, layout: false
      else
        render status: 404, json: {message: "DDAH #{ddah[:id]} hasn't been sent."}
      end
    else
      render status: 404, json: {message: "There is no such page."}
    end
  end

  def logout
    Rails.logger.info("session login: #{session[:logged_in]}")
    session[:logged_in] = false
    Rails.logger.info("session login: #{session[:logged_in]}")
    redirect_back(fallback_location: request.referrer)
  end

  def reenter_session
    Rails.logger.info("session login: #{session[:logged_in]}")
    session[:logged_in] = true
    Rails.logger.info("session login: #{session[:logged_in]}")
  end

  def test
    @instructors = []
    Instructor.all.each do |instructor|
      @instructors.push(instructor[:utorid].to_s)
    end
    render :test, layout: false
  end

end
