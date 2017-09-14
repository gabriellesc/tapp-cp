import React from 'react';
import { fromJS } from 'immutable';
import { appState } from './appState.js';

/* General helpers */

function msgFailure(text) {
    appState.alert('<b>Action Failed:</b> ' + text);
    return Promise.reject();
}

function respFailure(resp) {
    appState.alert('<b>Action Failed</b> ' + resp.url + ': ' + resp.statusText);
    return Promise.reject();
}

function fetchHelper(URL, init) {
    return fetch(URL, init).catch(function(error) {
        appState.alert('<b>' + init.method + ' ' + URL + '</b> Network error: ' + error);
        return Promise.reject(error);
    });
}

function getHelper(URL) {
    return fetchHelper(URL, {
        headers: {
            Accept: 'application/json',
        },
        method: 'GET',
        credentials: 'include', // This line is crucial in any fetch because it is needed to work with Shibboleth in production
    });
}

function postHelper(URL, body) {
    return fetchHelper(URL, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
        },
        method: 'POST',
        body: JSON.stringify(body),
        credentials: 'include',
    });
}

function deleteHelper(URL) {
    return fetchHelper(URL, {
        method: 'DELETE',
        credentials: 'include',
    });
}

function putHelper(URL, body) {
    return fetchHelper(URL, {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        method: 'PUT',
        body: JSON.stringify(body),
        credentials: 'include',
    });
}

function patchHelper(URL, body) {
    return fetchHelper(URL, {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        method: 'PATCH',
        body: JSON.stringify(body),
        credentials: 'include',
    });
}

/* Resource GETters */

const getCategories = () =>
    getHelper('/categories')
        .then(resp => (resp.ok ? resp.json().catch(msgFailure) : respFailure))
        .then(onFetchCategoriesSuccess);

const getCourses = user =>
    getHelper('/instructors/' + user + '/positions')
        .then(resp => (resp.ok ? resp.json().catch(msgFailure) : respFailure))
        .then(onFetchCoursesSuccess);

const getDuties = () =>
    getHelper('/duties')
        .then(resp => (resp.ok ? resp.json().catch(msgFailure) : respFailure))
        .then(onFetchDutiesSuccess);

const getOffers = user =>
    getHelper(user ? '/instructors/' + user + '/offers' : '/offers')
        .then(resp => (resp.ok ? resp.json().catch(msgFailure) : respFailure))
        .then(onFetchOffersSuccess);

const getSessions = () =>
    getHelper('/sessions')
        .then(resp => (resp.ok ? resp.json().catch(msgFailure) : respFailure))
        .then(onFetchSessionsSuccess);

const getTemplates = user =>
    getHelper('/instructors/' + user + '/templates')
        .then(resp => (resp.ok ? resp.json().catch(msgFailure) : respFailure))
        .then(onFetchTemplatesSuccess);

const getTrainings = () =>
    getHelper('/trainings')
        .then(resp => (resp.ok ? resp.json().catch(msgFailure) : respFailure))
        .then(onFetchTrainingsSuccess);

/* Success callbacks for resource GETters */

function onFetchCategoriesSuccess(resp) {
    let categories = {};

    resp.forEach(category => {
        categories[category.id] = category.name;
    });

    return categories;
}

function onFetchCoursesSuccess(resp) {
    let courses = {};

    resp.forEach(course => {
        courses[course.id] = {
            name: course.course_name,
            code: course.position,
            campus: (function(code) {
                switch (code) {
                    case 1:
                        return 'St. George';
                    case 3:
                        return 'Scarborough';
                    case 5:
                        return 'Mississauga';
                    default:
                        return 'Other';
                }
            })(course.campus_code),
            session: course.session_id,
            estimatedEnrol: course.current_enrolment,
            cap: course.cap_enrolment,
            waitlist: course.num_waitlisted,
            instructors: course.instructors,
        };
    });

    return courses;
}

function onFetchDutiesSuccess(resp) {
    let duties = {};

    resp.forEach(duty => {
        duties[duty.id] = duty.name;
    });

    return duties;
}

function onFetchOffersSuccess(resp) {
    let offers = {};

    resp.forEach(offer => {
        offers[offer.id] = {
            applicantId: offer.applicant_id,
            firstName: offer.applicant.first_name,
            lastName: offer.applicant.last_name,
            studentNumber: offer.applicant.student_number,
            email: offer.applicant.email,
            utorid: offer.applicant.utorid,
            course: offer.position,
            position: offer.position_id,
            session: offer.session ? offer.session.id : undefined,
            hours: offer.hours,
            nagCount: offer.nag_count,
            status: offer.status,
            hrStatus: offer.hr_status,
            ddahStatus: offer.ddah_status,
            sentAt: offer.send_date,
            printedAt: offer.print_time,
            link: offer.link,
            note: offer.commentary,
        };
    });

    return offers;
}

function onFetchSessionsSuccess(resp) {
    let sessions = {};

    resp.forEach(session => {
        sessions[session.id] = {
            year: session.year,
            semester: session.semester,
            pay: session.pay,
        };
    });

    return sessions;
}

function onFetchTemplatesSuccess(resp) {
    let templates = {};

    resp.forEach(template => {
        templates[template.id] = {
            name: template.name,
            tutCategory: template.tutorial_category,
            optional: template.optional,
            requiresTraining: template.scaling_learning,
            worksheet: template.allocations.map(allocation => ({
                id: allocation.id,
                units: allocation.num_unit,
                duty: allocation.duty_id,
                type: allocation.unit_name,
                time: allocation.minutes,
            })),
            trainings: template.trainings,
            categories: template.trainings,
        };
    });

    return templates;
}

function onFetchTrainingsSuccess(resp) {
    let trainings = {};

    resp.forEach(training => {
        trainings[training.id] = training.name;
    });

    return trainings;
}

/* Function to GET all resources */

function adminFetchAll() {
    appState.setFetchingOffersList(true);
    appState.setFetchingSessionsList(true);

    // when offers are successfully fetched, update the offers list; set fetching flag to false either way
    getOffers()
        .then(offers => {
            appState.setOffersList(fromJS(offers));
            appState.setFetchingOffersList(false, true);
        })
        .catch(() => appState.setFetchingOffersList(false));

    // when sessions are successfully fetched, update the sessions list; set fetching flag to false either way
    getSessions()
        .then(sessions => {
            appState.setSessionsList(fromJS(sessions));
            appState.setFetchingSessionsList(false, true);
        })
        .catch(() => appState.setFetchingSessionsList(false));
}

function instructorFetchAll() {
    let user = appState.getCurrentUserName();

    appState.setFetchingCategoriesList(true);
    appState.setFetchingCoursesList(true);
    appState.setFetchingDutiesList(true);
    appState.setFetchingOffersList(true);
    appState.setFetchingTemplatesList(true);
    appState.setFetchingTrainingsList(true);

    // when categories are successfully fetched, update the categories list; set fetching flag to false either way
    getCategories()
        .then(categories => {
            appState.setCategoriesList(fromJS(categories));
            appState.setFetchingCategoriesList(false, true);
        })
        .catch(() => appState.setFetchingCategoriesList(false));

    // when courses are successfully fetched, update the courses list; set fetching flag to false either way
    getCourses(user)
        .then(courses => {
            appState.setCoursesList(fromJS(courses));
            appState.setFetchingCoursesList(false, true);
        })
        .catch(() => appState.setFetchingCoursesList(false));

    // when duties are successfully fetched, update the duties list; set fetching flag to false either way
    getDuties()
        .then(duties => {
            appState.setDutiesList(fromJS(duties));
            appState.setFetchingDutiesList(false, true);
        })
        .catch(() => appState.setFetchingDutiesList(false));

    // when offers are successfully fetched, update the offers list; set fetching flag to false either way
    getOffers(user)
        .then(offers => {
            appState.setOffersList(fromJS(offers));
            appState.setFetchingOffersList(false, true);
        })
        .catch(() => appState.setFetchingOffersList(false));

    // when templates are successfully fetched, update the templates list; set fetching flag to false either way
    getTemplates(user)
        .then(templates => {
            appState.setTemplatesList(fromJS(templates));
            appState.setFetchingTemplatesList(false, true);
        })
        .catch(() => appState.setFetchingTemplatesList(false));

    // when trainings are successfully fetched, update the trainings list; set fetching flag to false either way
    getTrainings()
        .then(trainings => {
            appState.setTrainingsList(fromJS(trainings));
            appState.setFetchingTrainingsList(false, true);
        })
        .catch(() => appState.setFetchingTrainingsList(false));
}

// import locked assignments from TAPP
function importAssignments() {
    appState.setImporting(true);

    postHelper('/import/locked-assignments', {})
        .then(resp => {
            // import succeeded
            if (resp.ok) {
                return resp.json().then(resp => {
                    // import succeeded with errors
                    if (resp.errors) {
                        return resp.message.forEach(message => appState.alert(message));
                    }
                    return Promise.resolve();
                });
            }
            // import failed with errors
            if (resp.status == 404) {
                return resp
                    .json()
                    .then(resp => resp.message.forEach(message => appState.alert(message)))
                    .then(Promise.reject);
            }
            return respFailure(resp);
        })
        .then(
            () => {
                appState.setImporting(false, true);

                appState.setFetchingOffersList(true);
                getOffers()
                    .then(offers => {
                        appState.setOffersList(fromJS(offers));
                        appState.setFetchingOffersList(false, true);
                    })
                    .catch(() => appState.setFetchingOffersList(false));
            },
            () => appState.setImporting(false)
        );
}

// send CHASS offers data
function importOffers(data) {
    appState.setImporting(true);

    postHelper('/import/offers', { chass_offers: data })
        .then(resp => {
            // import succeeded
            if (resp.ok) {
                return resp.json().then(resp => {
                    // import succeeded with errors
                    if (resp.errors) {
                        return resp.message.forEach(message => appState.alert(message));
                    }
                    return Promise.resolve();
                });
            }
            // import failed with errors
            if (resp.status == 404) {
                return resp
                    .json()
                    .then(resp => resp.message.forEach(message => appState.alert(message)))
                    .then(Promise.reject);
            }
            return respFailure(resp);
        })
        .then(
            () => {
                appState.setImporting(false, true);

                appState.setFetchingOffersList(true);
                getOffers()
                    .then(offers => {
                        appState.setOffersList(fromJS(offers));
                        appState.setFetchingOffersList(false, true);
                    })
                    .catch(() => appState.setFetchingOffersList(false));
            },
            () => appState.setImporting(false)
        );
}

// send contracts
function sendContracts(offers) {
    let validOffers = offers;

    // check which contracts can be sent
    postHelper('/offers/can-send-contract', { contracts: offers })
        .then(resp => {
            if (resp.status == 404) {
                // some contracts cannot be sent
                let offersList = appState.getOffersList();

                return resp.json().then(res => {
                    res.invalid_offers.forEach(offer => {
                        appState.alert(
                            '<b>Error</b>: Cannot send contract to ' +
                                offersList.getIn([offer.toString(), 'lastName']) +
                                ', ' +
                                offersList.getIn([offer.toString(), 'firstName']) +
                                ' for ' +
                                offersList.getIn([offer.toString(), 'position'])
                        );
                        // remove invalid offer(s) from offer list
                        validOffers.splice(validOffers.indexOf(offer), 1);
                    });

                    if (validOffers.length == 0) {
                        return Promise.reject();
                    }
                }, msgFailure);
            } else if (!resp.ok) {
                // request failed
                return respFailure(resp);
            }
        })
        // send contracts for valid offers
        .then(() => postHelper('/offers/send-contracts', { offers: validOffers }))
        .then(() => {
            appState.setFetchingOffersList(true);
            getOffers()
                .then(offers => {
                    appState.setOffersList(fromJS(offers));
                    appState.setFetchingOffersList(false, true);
                })
                .catch(() => appState.setFetchingOffersList(false));
        });
}

// nag applicants
function nag(offers) {
    let validOffers = offers;

    // check which applicants can be nagged
    postHelper('/offers/can-nag', { contracts: offers })
        .then(resp => {
            if (resp.status == 404) {
                // some applicants cannot be nagged
                let offersList = appState.getOffersList();

                return resp.json().then(res => {
                    res.invalid_offers.forEach(offer => {
                        appState.alert(
                            '<b>Error</b>: Cannot nag ' +
                                offersList.getIn([offer.toString(), 'lastName']) +
                                ', ' +
                                offersList.getIn([offer.toString(), 'firstName']) +
                                ' about ' +
                                offersList.getIn([offer.toString(), 'position'])
                        );
                        // remove invalid offer(s) from offer list
                        validOffers.splice(validOffers.indexOf(offer), 1);
                    });

                    if (validOffers.length == 0) {
                        return Promise.reject();
                    }
                }, msgFailure);
            } else if (!resp.ok) {
                // request failed
                return respFailure(resp);
            }
        })
        // nag valid offers
        .then(() => postHelper('/offers/nag', { contracts: validOffers }))
        .then(() => {
            appState.setFetchingOffersList(true);
            getOffers()
                .then(offers => {
                    appState.setOffersList(fromJS(offers));
                    appState.setFetchingOffersList(false, true);
                })
                .catch(() => appState.setFetchingOffersList(false));
        });
}

// mark contracts as hr_processed
function setHrProcessed(offers) {
    let validOffers = offers;

    // check which offers can be marked as hr_processed
    postHelper('/offers/can-hr-update', { offers: offers })
        .then(resp => {
            if (resp.status == 404) {
                // some offers cannot be updated
                let offersList = appState.getOffersList();

                return resp.json().then(res => {
                    res.invalid_offers.forEach(offer => {
                        appState.alert(
                            '<b>Error</b>: Cannot mark offer to ' +
                                offersList.getIn([offer.toString(), 'lastName']) +
                                ', ' +
                                offersList.getIn([offer.toString(), 'firstName']) +
                                ' for ' +
                                offersList.getIn([offer.toString(), 'position']) +
                                ' as HRIS processed'
                        );
                        // remove invalid offer(s) from offer list
                        validOffers.splice(validOffers.indexOf(offer), 1);
                    });

                    if (validOffers.length == 0) {
                        return Promise.reject();
                    }
                }, msgFailure);
            } else if (!resp.ok) {
                // request failed
                return respFailure(resp);
            }
        })
        // update valid offers
        .then(() =>
            putHelper('/offers/batch-update', {
                offers: validOffers,
                hr_status: 'Processed',
            })
        )
        .then(() => {
            appState.setFetchingOffersList(true);
            getOffers()
                .then(offers => {
                    appState.setOffersList(fromJS(offers));
                    appState.setFetchingOffersList(false, true);
                })
                .catch(() => appState.setFetchingOffersList(false));
        });
}

// mark contracts as ddah_accepted
function setDdahAccepted(offers) {
    let validOffers = offers;

    // check which offers can be marked as ddah_accepted
    postHelper('/offers/can-ddah-update', { offers: offers })
        .then(resp => {
            if (resp.status == 404) {
                // some offers cannot be updated
                let offersList = appState.getOffersList();

                return resp.json().then(res => {
                    res.invalid_offers.forEach(offer => {
                        appState.alert(
                            '<b>Error</b>: Cannot mark offer to ' +
                                offersList.getIn([offer.toString(), 'lastName']) +
                                ', ' +
                                offersList.getIn([offer.toString(), 'firstName']) +
                                ' for ' +
                                offersList.getIn([offer.toString(), 'position']) +
                                ' as DDAH accepted'
                        );
                        // remove invalid offer(s) from offer list
                        validOffers.splice(validOffers.indexOf(offer), 1);
                    });
                    if (validOffers.length == 0) {
                        return Promise.reject();
                    }
                }, msgFailure);
            } else if (!resp.ok) {
                // request failed
                return respFailure(resp);
            }
        })
        // update valid offers
        .then(() =>
            putHelper('/offers/batch-update', {
                offers: validOffers,
                ddah_status: 'Accepted',
            })
        )
        .then(() => {
            appState.setFetchingOffersList(true);
            getOffers()
                .then(offers => {
                    appState.setOffersList(fromJS(offers));
                    appState.setFetchingOffersList(false, true);
                })
                .catch(() => appState.setFetchingOffersList(false));
        });
}

// show the contract for this offer in a new window, as an applicant would see it
function showContractApplicant(offer) {
    window.open('/offers/' + offer + '/pdf');
}

// show the contract for this offer in a new window, as HR would see it
function showContractHr(offer) {
    postHelper('/offers/print', { contracts: [offer], update: false })
        .then(resp => (resp.ok ? resp.blob().catch(msgFailure) : respFailure))
        .then(blob => {
            let fileURL = URL.createObjectURL(blob);
            let contractWindow = window.open(fileURL);
            contractWindow.onclose = () => URL.revokeObjectURL(fileURL);
        });
}

// withdraw offers
function withdrawOffers(offers) {
    // create an array of promises for each offer being withdrawn
    // force each promise to resolve so that we can see which failed.
    // foible of all is that it will reject as soon as any promise fails.
    // hence, by resolving each promise we frustrate this laziness.
    // (and also necessitates the loop looking at the responses below)
    let promises = offers.map(offer =>
        postHelper('/offers/' + offer + '/decision/withdraw', {}).then(
            resp => Promise.resolve(resp),
            resp => Promise.resolve(resp)
        )
    );

    // re-examine the responses we squirrelled away above.
    Promise.all(promises).then(responses =>
        responses.forEach(resp => {
            if (resp.type != 'error') {
                // network error did not occur
                if (resp.ok) {
                    appState.setFetchingOffersList(true);
                    getOffers()
                        .then(offers => {
                            appState.setOffersList(fromJS(offers));
                            appState.setFetchingOffersList(false, true);
                        })
                        .catch(() => appState.setFetchingOffersList(false));
                } else {
                    // request failed
                    resp.json().then(resp => appState.alert(resp.message)); // IS THIS REALLY WHAT WE EXPECT?
                }
            }
        })
    );
}

// print contracts
function print(offers) {
    let validOffers = offers;

    // check which contracts can be printed
    let printPromise = postHelper('/offers/can-print', { contracts: offers })
        .then(resp => {
            if (resp.status == 404) {
                // some contracts cannot be printed
                let offersList = appState.getOffersList();

                return resp.json().then(res => {
                    res.invalid_offers.forEach(offer => {
                        appState.alert(
                            '<b>Error</b>: Cannot print ' +
                                offersList.getIn([offer.toString(), 'position']) +
                                ' contract for ' +
                                offersList.getIn([offer.toString(), 'lastName']) +
                                ', ' +
                                offersList.getIn([offer.toString(), 'firstName'])
                        );
                        // remove invalid offer(s) from offer list
                        validOffers.splice(validOffers.indexOf(offer), 1);
                    });

                    if (validOffers.length == 0) {
                        return Promise.reject();
                    }
                }, msgFailure);
            } else if (!resp.ok) {
                // request failed
                return respFailure(resp);
            }
        })
        // print valid offers
        .then(() =>
            postHelper('/offers/print', {
                contracts: validOffers,
                update: true,
            })
        )
        .then(resp => (resp.ok ? resp.blob().catch(msgFailure) : respFailure));

    printPromise.then(blob => {
        let fileURL = URL.createObjectURL(blob);
        let pdfWindow = window.open(fileURL);
        pdfWindow.onclose = () => URL.revokeObjectURL(fileURL);
        pdfWindow.document.onload = pdfWindow.print();
    });

    printPromise.then(() => {
        appState.setFetchingOffersList(true);
        getOffers()
            .then(offers => {
                appState.setOffersList(fromJS(offers));
                appState.setFetchingOffersList(false, true);
            })
            .catch(() => appState.setFetchingOffersList(false));
    });
}

// change session pay
function updateSessionPay(session, pay) {
    putHelper('/sessions/' + session, { pay: pay })
        .then(resp => (resp.ok ? resp : respFailure))
        .then(
            () => {
                appState.setFetchingSessionsList(true);
                getSessions()
                    .then(sessions => {
                        appState.setSessionsList(fromJS(sessions));
                        appState.setFetchingSessionsList(false, true);
                    })
                    .catch(() => appState.setFetchingSessionsList(false));
            },
            resp => resp.json().then(resp => appState.alert(resp.message)) // IS THIS REALLY WHAT WE EXPECT?
        );
}

// add/update the note for a withdrawn offer
function noteOffer(offer, note) {
    putHelper('/offers/' + offer, { commentary: note })
        .then(resp => (resp.ok ? resp : respFailure))
        .then(() => {
            appState.setFetchingOffersList(true);
            getOffers()
                .then(offers => {
                    appState.setOffersList(fromJS(offers));
                    appState.setFetchingOffersList(false, true);
                })
                .catch(() => appState.setFetchingOffersList(false));
        });
}

// clear HR status
function clearHrStatus(offers) {
    let validOffers = offers;

    // check which offers can have their HR status cleared
    postHelper('/offers/can-clear-hris-status', { contracts: offers })
        .then(resp => {
            if (resp.status == 404) {
                // some offers cannot be updated
                let offersList = appState.getOffersList();

                return resp.json().then(res => {
                    res.invalid_offers.forEach(offer => {
                        appState.alert(
                            '<b>Error</b>: Cannot clear HRIS status for offer to ' +
                                offersList.getIn([offer.toString(), 'lastName']) +
                                ', ' +
                                offersList.getIn([offer.toString(), 'firstName']) +
                                ' for ' +
                                offersList.getIn([offer.toString(), 'position'])
                        );
                        // remove invalid offer(s) from offer list
                        validOffers.splice(validOffers.indexOf(offer), 1);
                    });
                    if (validOffers.length == 0) {
                        return Promise.reject();
                    }
                }, msgFailure);
            } else if (!resp.ok) {
                // request failed
                return respFailure(resp);
            }
        })
        // update valid offers
        .then(() => postHelper('/offers/clear-hris-status', { contracts: validOffers }))
        .then(() => {
            appState.setFetchingOffersList(true);
            getOffers()
                .then(offers => {
                    appState.setOffersList(fromJS(offers));
                    appState.setFetchingOffersList(false, true);
                })
                .catch(() => appState.setFetchingOffersList(false));
        });
}

// set status to accepted
function setOfferAccepted(offer) {
    postHelper('/offers/' + offer + '/accept', {})
        .then(resp => {
            if (resp.status == 404) {
                return resp.json().then(resp => appState.alert(resp.message)).then(Promise.reject);
            } else if (!resp.ok) {
                return respFailure(resp);
            }
        })
        .then(() => {
            appState.setFetchingOffersList(true);
            getOffers()
                .then(offers => {
                    appState.setOffersList(fromJS(offers));
                    appState.setFetchingOffersList(false, true);
                })
                .catch(() => appState.setFetchingOffersList(false));
        });
}

// set status to unsent and clear other information
function resetOffer(offer) {
    postHelper('/offers/' + offer + '/reset', {})
        .then(resp => (resp.ok ? resp : respFailure))
        .then(() => {
            appState.setFetchingOffersList(true);
            getOffers()
                .then(offers => {
                    appState.setOffersList(fromJS(offers));
                    appState.setFetchingOffersList(false, true);
                })
                .catch(() => appState.setFetchingOffersList(false));
        });
}

// export all offers from the session to CSV
function exportOffers(session) {
    window.open('/export/cp-offers/' + session);
}

// create a new, empty template with this name
function createTemplate(name, position) {
    let user = appState.getCurrentUserName();

    return postHelper('/instructors/' + user + '/templates', { name: name, position_id: position })
        .then(resp => {
            if (resp.ok) {
                return resp.json().catch(msgFailure);
            }
            if (resp.status == 404) {
                return resp.json().catch(msgFailure).then(res => msgFailure(res.message));
            }
            return respFailure(resp);
        })
        .then(resp => {
            appState.setFetchingTemplatesList(true);
            return getTemplates(user)
                .then(templates => {
                    appState.setTemplatesList(fromJS(templates));
                    appState.setFetchingTemplatesList(false, true);
                    return resp.id; // return the id of the newly-created template
                })
                .catch(() => appState.setFetchingTemplatesList(false));
        });
}

// update an existing template
function updateTemplate(id, ddah) {
    let user = appState.getCurrentUserName();

    return patchHelper('/templates/' + id, ddah)
        .then(resp => (resp.ok ? resp : respFailure))
        .then(() => {
            appState.setFetchingTemplatesList(true);
            return getTemplates(user)
                .then(templates => {
                    appState.setTemplatesList(fromJS(templates));
                    appState.setFetchingTemplatesList(false, true);
                })
                .catch(() => appState.setFetchingTemplatesList(false));
        });
}

// create a new template using data from an existing ddah
function createTemplateFromDdah(name, ddah) {
    let user = appState.getCurrentUserName();

    postHelper('/ddahs/' + ddah + '/new-template', { name: name })
        .then(resp => (resp.ok ? resp : respFailure))
        .then(() => {
            appState.setFetchingTemplatesList(true);
            getTemplates(user)
                .then(templates => {
                    appState.setTemplatesList(fromJS(templates));
                    appState.setFetchingTemplatesList(false, true);
                })
                .catch(() => appState.setFetchingTemplatesList(false));
        });
}

// get current user role(s) and username
// if we are in development, set the current user name to a special value
function fetchAuth() {
    return getHelper('/roles')
        .then(resp => (resp.ok ? resp.json().catch(msgFailure) : respFailure))
        .then(resp => {
            if (resp.development) {
                appState.setCurrentUserRoles(['cp_admin', 'hr_assistant', 'instructor']);
                // default to cp_admin as selected user role
                appState.selectUserRole('instructor');
                appState.setCurrentUserName('DEV');
            } else {
                // filter out roles not relevant to this application
                let roles = resp.roles.filter(role =>
                    ['cp_admin', 'hr_assistant', 'instructor'].includes(role)
                );
                appState.setCurrentUserRoles(roles);
                appState.selectUserRole(roles[0]);
                appState.setCurrentUserName(resp.utorid);
            }
        });
}

export {
    adminFetchAll,
    instructorFetchAll,
    importOffers,
    importAssignments,
    sendContracts,
    nag,
    setHrProcessed,
    setDdahAccepted,
    showContractApplicant,
    showContractHr,
    withdrawOffers,
    print,
    updateSessionPay,
    noteOffer,
    exportOffers,
    clearHrStatus,
    setOfferAccepted,
    resetOffer,
    createTemplate,
    updateTemplate,
    createTemplateFromDdah,
    fetchAuth,
};
