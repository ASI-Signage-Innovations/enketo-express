"use strict";

var Q = require( 'q' ),
    utils = require( '../lib/utils' ),
    transformer = require( '../lib/enketo-transformer' ),
    prefix = 'ca:',
    expiry = 30 * 24 * 60 * 60,
    config = require( '../../config/config' ),
    client = require( 'redis' ).createClient( config.redis.cache.port, config.redis.cache.host, {
        auth_pass: config.redis.cache.password
    } ),
    debug = require( 'debug' )( 'cache-model' );

// in test environment, switch to different db
if ( process.env.NODE_ENV === 'test' ) {
    client.select( 15 );
}

/** 
 * Gets an item from the cache.
 *
 * @param  {{openRosaServer: string, openRosaId: string }} survey [description]
 * @return {[type]}        [description]
 */
function _getSurvey( survey ) {
    var key, error,
        deferred = Q.defer();

    if ( !survey || !survey.openRosaServer || !survey.openRosaId ) {
        error = new Error( 'Bad Request. Survey information to perform cache lookup is not complete.' );
        error.status = 400;
        deferred.reject( error );
    } else {
        key = _getKey( survey );

        client.hgetall( key, function( error, cacheObj ) {
            if ( error ) {
                deferred.reject( error );
            } else if ( !cacheObj ) {
                deferred.resolve( null );
            } else {
                // form is 'actively used' so we're resetting the cache expiry
                debug( 'cache is up to date and used, resetting expiry' );
                client.expire( key, expiry );
                survey.form = cacheObj.form;
                survey.model = cacheObj.model;
                deferred.resolve( survey );
            }
        } );
    }

    return deferred.promise;
}

/**
 * Checks if cache is present and up to date
 *
 * @param  {{openRosaServer: string, openRosaId: string, info: {hash: string }}} survey [description]
 * @return {Boolean}        [description]
 */
function _isCacheUpToDate( survey ) {
    var key, error,
        deferred = Q.defer();

    if ( !survey || !survey.openRosaServer || !survey.openRosaId || !survey.info.hash ) {
        error = new Error( 'Bad Request. Survey information to perform cache check is not complete.' );
        error.status = 400;
        deferred.reject( error );
    } else {
        key = _getKey( survey );

        client.hgetall( key, function( error, cacheObj ) {
            if ( error ) {
                deferred.reject( error );
            } else if ( !cacheObj ) {
                debug( 'cache is missing' );
                deferred.resolve( null );
            } else {
                // Adding the hashes to the referenced survey object can be efficient, since this object 
                // is passed around. The hashes may therefore already have been calculated 
                // when setting the cache later on.
                // mediaHash can be "null" in Redis and null in reality so it is cast to a string
                _addHashes( survey );
                if ( cacheObj.formHash !== survey.formHash || cacheObj.mediaHash !== String( survey.mediaHash ) || cacheObj.xslHash !== survey.xslHash ) {
                    debug( 'cache is obsolete' );
                    deferred.resolve( false );
                } else {
                    deferred.resolve( true );
                }
            }
        } );
    }

    return deferred.promise;
}

/**
 * Adds an item to the cache
 * @param {[type]} survey [description]
 */
function _setSurvey( survey ) {
    var obj, key, error,
        deferred = Q.defer();

    if ( !survey || !survey.openRosaServer || !survey.openRosaId || !survey.info.hash || !survey.form || !survey.model ) {
        error = new Error( 'Bad Request. Survey information to cache is not complete.' );
        error.status = 400;
        deferred.reject( error );
    } else {
        _addHashes( survey );
        obj = {
            formHash: survey.formHash,
            mediaHash: survey.mediaHash,
            xslHash: survey.xslHash,
            form: survey.form,
            model: survey.model
        };

        key = _getKey( survey );

        client.hmset( key, obj, function( error ) {
            if ( error ) {
                deferred.reject( error );
            } else {
                debug( 'cache has been updated' );
                // expire in 30 days
                client.expire( key, expiry );
                deferred.resolve( survey );
            }
        } );
    }

    return deferred.promise;
}

/**
 * Flushes the cache of a single survey
 *
 * @param {[type]} survey [description]
 */
function _flushSurvey( survey ) {
    var obj, key, error,
        deferred = Q.defer();

    if ( !survey || !survey.openRosaServer || !survey.openRosaId ) {
        error = new Error( 'Bad Request. Survey information to cache is not complete.' );
        error.status = 400;
        deferred.reject( error );
    } else {
        key = _getKey( survey );
        client.del( key, function( error ) {
            if ( error ) {
                deferred.reject( error );
            } else {
                delete survey.form;
                delete survey.model;
                delete survey.formHash;
                delete survey.xlsHash;
                delete survey.mediaHash;
                deferred.resolve( survey );
            }
        } );

        return deferred.promise;
    }
}

/**
 * Completely empties the cache
 * @return {[type]} [description]
 */
function _flushAll() {
    var deferred = Q.defer();

    client.keys( prefix + '*', function( error, keys ) {
        if ( error ) {
            deferred.reject( error );
        }
        keys.forEach( function( key ) {
            client.del( key, function( error ) {
                if ( error ) {
                    deferred.reject( error );
                } else {
                    deferred.resolve();
                }
            } );
        } );

        deferred.resolve( true );
    } );

    return deferred.promise;
}

/**
 * Gets the key used for the cache item
 * @param  {{openRosaServer: string, openRosaId: string}} survey [description]
 * @return {string}        [description]
 */
function _getKey( survey ) {
    var openRosaKey = utils.getOpenRosaKey( survey, prefix );
    return ( openRosaKey ) ? openRosaKey : null;
}

/**
 * Adds the 3 relevant hashes to the survey object if they haven't been added already.
 * @param {[type]} survey [description]
 */
function _addHashes( survey ) {
    survey.formHash = survey.formHash || survey.info.hash;
    survey.mediaHash = survey.mediaHash || ( ( survey.manifest && survey.manifest.length > 0 ) ? utils.md5( JSON.stringify( survey.manifest ) ) : null );
    survey.xslHash = survey.xslHash || transformer.version;
}

module.exports = {
    get: _getSurvey,
    set: _setSurvey,
    check: _isCacheUpToDate,
    flush: _flushSurvey,
    flushAll: _flushAll
};
