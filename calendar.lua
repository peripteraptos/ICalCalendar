local calendar = {}
local php

function calendar.setupInterface( options )
    -- Remove setup function
    calendar.setupInterface = nil

    -- Copy the PHP callbacks to a local variable, and remove the global
    php = mw_interface
    mw_interface = nil

    -- Do any other setup here

    -- Install into the mw global
    mw = mw or {}
    mw.ext = mw.ext or {}
    mw.ext.calendar = calendar

    -- Indicate that we're loaded
    package.loaded['mw.ext.calendar'] = calendar
end

function calendar.query()
    return php.query()
end

return calendar
