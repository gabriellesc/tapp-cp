import React from 'react';
import {
    Grid,
    ButtonToolbar,
    Form,
    FormGroup,
    ControlLabel,
    FormControl,
    DropdownButton,
    MenuItem,
    Button,
} from 'react-bootstrap';

import { TableMenu } from './tableMenu.js';
import { Table } from './table.js';

const getCheckboxElements = () => document.getElementsByClassName('offer-checkbox');

const getSelectedOffers = () =>
    Array.prototype.filter
        .call(getCheckboxElements(), box => box.checked == true)
        .map(box => box.id);

class DdahControlPanel extends React.Component {
    constructor(props) {
        super(props);

        // most recently-clicked checkbox, stored to allow range selection
        this.lastClicked = null;
    }

    selectThisTab() {
        if (this.props.appState.getSelectedNavTab() != this.props.navKey) {
            this.props.appState.selectNavTab(this.props.navKey);
        }
    }

    componentWillMount() {
        this.selectThisTab();
    }

    componentWillUpdate() {
        this.selectThisTab();
    }

    render() {
        const role = this.props.appState.getSelectedUserRole();

        let nullCheck =
            this.props.appState.isOffersListNull() ||
            this.props.appState.isSessionsListNull() ||
            this.props.appState.isDdahsListNull();
        if (nullCheck) {
            return <div id="loader" />;
        }

        let fetchCheck =
            this.props.appState.fetchingOffers() ||
            this.props.appState.fetchingSessions() ||
            this.props.appState.fetchingDdahs();
        let cursorStyle = { cursor: fetchCheck ? 'progress' : 'auto' };

        this.config = [
            {
                header: (
                    <input
                        type="checkbox"
                        defaultChecked={false}
                        id="header-checkbox"
                        onClick={event =>
                            Array.prototype.forEach.call(getCheckboxElements(), box => {
                                box.checked = event.target.checked;
                            })}
                    />
                ),
                data: p =>
                    <input
                        type="checkbox"
                        defaultChecked={false}
                        className="offer-checkbox"
                        id={p.offerId}
                        onClick={event => {
                            // range selection using shift key (range is from current box (offerId) to last-clicked box
                            if (this.lastClicked && event.shiftKey) {
                                let first = false,
                                    last = false;

                                Array.prototype.forEach.call(getCheckboxElements(), box => {
                                    if (
                                        !first &&
                                        (box.id == p.offerId || box.id == this.lastClicked)
                                    ) {
                                        // starting box
                                        first = true;
                                        box.checked = true;
                                    } else if (first && !last) {
                                        // box is in range
                                        if (box.id == p.offerId || box.id == this.lastClicked) {
                                            // ending box
                                            last = true;
                                        }
                                        box.checked = true;
                                    }
                                });
                            }

                            this.lastClicked = p.offerId;
                        }}
                    />,

                style: { width: 0.01, textAlign: 'center' },
            },
            {
                header: 'Last Name',
                data: p => p.offer.get('lastName'),
                sortData: p => p.get('lastName'),

                style: { width: 0.08 },
            },
            {
                header: 'First Name',
                data: p => p.offer.get('firstName'),
                sortData: p => p.get('firstName'),

                style: { width: 0.08 },
            },
            {
                header: 'Email',
                data: p => p.offer.get('email'),
                sortData: p => p.get('email'),

                style: { width: 0.16 },
            },
            {
                header: 'Position',
                data: p => p.offer.get('course'),
                sortData: p => p.get('course'),

                filterLabel: 'Position',
                filterCategories: this.props.appState.getPositions(),
                // filter out offers not to that position
                filterFuncs: this.props.appState
                    .getPositions()
                    .map(position => p => p.get('course') == position),

                style: { width: 0.1 },
            },
            {
                header: 'DDAH Status',
                data: p =>
                    p.offer.get('ddahStatus')
                        ? <span>
                              {p.offer.get('ddahStatus')}&nbsp;
                              {!['None', 'Created'].includes(p.offer.get('ddahStatus')) &&
                                  <i
                                      className="fa fa-search"
                                      style={{ fontSize: '16px', cursor: 'pointer' }}
                                      title="PDF preview"
                                      onClick={() => this.props.appState.previewDdah(p.offerId)}
                                  />}
                          </span>
                        : '-',
                sortData: p => (p.get('ddahStatus') ? p.get('ddahStatus') : ''),

                filterLabel: 'DDAH Status',
                filterCategories: ['-', 'Created', 'Ready', 'Approved', 'Pending', 'Accepted'],
                filterFuncs: [p => p.get('ddahStatus') == undefined].concat(
                    ['Created', 'Ready', 'Approved', 'Pending', 'Accepted'].map(status => p =>
                        p.get('ddahStatus') == status
                    )
                ),
            },
        ];

        return (
            <Grid fluid id="ddahs-grid" style={cursorStyle}>
                <ButtonToolbar id="dropdown-menu">
                    <SessionsDropdown {...this.props} />

                    <DdahsMenu {...this.props} />
                    <CommMenu {...this.props} />
                    <PrintButton {...this.props} />

                    <TableMenu
                        config={this.config}
                        getSelectedSortFields={() => this.props.appState.getSorts()}
                        anyFilterSelected={field => this.props.appState.anyFilterSelected(field)}
                        isFilterSelected={(field, category) =>
                            this.props.appState.isFilterSelected(field, category)}
                        toggleFilter={(field, category) =>
                            this.props.appState.toggleFilter(field, category)}
                        clearFilters={() => this.props.appState.clearFilters()}
                        addSort={field => this.props.appState.addSort(field)}
                        removeSort={field => this.props.appState.removeSort(field)}
                        toggleSortDir={field => this.props.appState.toggleSortDir(field)}
                    />
                </ButtonToolbar>

                <Table
                    config={this.config}
                    getOffers={() => {
                        let session = this.props.appState.getSelectedSession();
                        if (session != '') {
                            return this.props.appState
                                .getOffersList()
                                .filter(offer => offer.get('session') == session);
                        }
                        return this.props.appState.getOffersList();
                    }}
                    getSelectedSortFields={() => this.props.appState.getSorts()}
                    getSelectedFilters={() => this.props.appState.getFilters()}
                />
            </Grid>
        );
    }
}

// session selector
const SessionsDropdown = props =>
    <Form inline id="sessions">
        <FormGroup>
            <ControlLabel>Session:</ControlLabel>&ensp;
            <FormControl
                id="session"
                componentClass="select"
                onChange={event => {
                    props.appState.selectSession(event.target.value);
                }}>
                <option value="" key="session-all">
                    all
                </option>
                {props.appState.getSessionsList().map((session, sessionId) =>
                    <option value={sessionId}>
                        {session.get('semester')}&nbsp;{session.get('year')}
                    </option>
                )}
            </FormControl>
        </FormGroup>
    </Form>;

const DdahsMenu = props =>
    <DropdownButton bsStyle="primary" title="Update DDAH forms" id="ddahs-dropdown">
        <MenuItem onClick={() => props.appState.sendDdahs(getSelectedOffers())}>
            Send DDAH form(s)
        </MenuItem>
        <MenuItem divider />
        <MenuItem
            onClick={() =>
                props.appState.alert(
                    '<b>Approve DDAH forms</b> This functionality is not currently supported.'
                )}>
            Approve DDAH form(s)
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={() => props.appState.setDdahAccepted(getSelectedOffers())}>
            Set DDAH status to <i>Accepted</i>
        </MenuItem>
    </DropdownButton>;

const CommMenu = props =>
    <DropdownButton bsStyle="primary" title="Communicate" id="comm-dropdown">
        <MenuItem onClick={() => props.appState.email(getSelectedOffers())}>
            Email&ensp;[blank]
        </MenuItem>
        <MenuItem onClick={() => props.appState.emailDdah(getSelectedOffers())}>
            Email&ensp;[DDAH form]
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={() => props.appState.nagApplicantDdahs(getSelectedOffers())}>
            Nag applicant
        </MenuItem>
        <MenuItem
            onClick={() =>
                props.appState.alert(
                    '<b>Nag instructors</b> This functionality is not currently supported.'
                )}>
            Nag instructor(s)
        </MenuItem>
    </DropdownButton>;

const PrintButton = props =>
    <Button
        bsStyle="primary"
        onClick={() =>
            props.appState.alert(
                '<b>Print DDAH forms</b> This functionality is not currently supported.'
            )}>
        Print DDAH forms
    </Button>;

export { DdahControlPanel };
