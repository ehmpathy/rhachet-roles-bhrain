# criteria.blackbox: getWeather

## usecase.1 = get weather for valid location

given('a valid location')
  when('getWeather is called')
    then('returns temperature')
    then('returns humidity')
    then('returns conditions')

## usecase.2 = handle invalid location

given('an invalid location')
  when('getWeather is called')
    then('throws BadRequestError')
    then('error message includes location')

## usecase.3 = handle api timeout

given('api times out')
  when('getWeather is called')
    then('retries up to 3 times')
    then('throws on final failure')
