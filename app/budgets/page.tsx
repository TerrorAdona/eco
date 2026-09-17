"use client"

import React, { useEffect } from 'react' 
import { testConsole } from '../action'

const page = () => {

    useEffect(() => {
        testConsole()
    }, [])
    return (
        <div>
            page
        </div>
    )

}

export default page
