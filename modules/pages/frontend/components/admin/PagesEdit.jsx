/* eslint-disable react/prop-types, no-loop-func */

import React, { lazy, Component } from 'react';
import { I18n } from '@lingui/react';
import { connect } from 'react-redux';
import { remove as removeCookie } from 'es-cookie';
import axios from 'axios';
import { Trans, t } from '@lingui/macro';
import { history } from '../../../../../shared/store/configureStore';
import appDataRuntimeSetToken from '../../../../../shared/actions/appDataRuntimeSetToken';
import appDataSetUser from '../../../../../shared/actions/appDataSetUser';
import config from '../../../../../etc/config.json';
import appDataRuntimeSetDocumentTitle from '../../../../../shared/actions/appDataRuntimeSetDocumentTitle';
import UIkit from '../../../../../shared/utils/uikit';
import DialogFolder from './DialogFolder.jsx';

const AdminPanel = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "AdminPanel" */'../../../../../shared/components/AdminPanel/AdminPanel.jsx'));
const FormBuilder = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "FormBuilder" */'../../../../../shared/components/FormBuilder/index.jsx'));

class PagesEdit extends Component {
    constructor(props) {
        super(props);
        this.editPagesForm = React.createRef();
        this.dialogFolder = React.createRef();
    }

    state = {
        loadingError: false
    }

    componentDidMount = () => {
        if (!this.props.appDataRuntime.token) {
            history.push('/users/auth?redirect=/admin/pages');
        }
    }

    deauthorize = () => {
        this.props.appDataRuntimeSetTokenAction(null);
        this.props.appDataSetUserAction({});
        removeCookie(`${config.siteId}_auth`);
        history.push(`/users/auth?redirect=/admin/pages`);
    }

    onPagesTableLoadError = data => {
        if (data && data.statusCode === 403) {
            this.deauthorize();
        }
    }

    onSaveSuccessHandler = i18n => {
        UIkit.notification({
            message: i18n._(t`Data has been saved successfully`),
            status: 'success'
        });
        history.push('/admin/pages?reload=1');
    }

    loadFoldersData = () => new Promise((resolve, reject) => {
        axios.post(`${config.apiURL}/api/pages/folders/load`, {
            token: this.props.appDataRuntime.token,
            language: this.props.appData.language
        }, { headers: { 'content-type': 'application/json' } }).then(async res => {
            if (res && res.data && res.data.statusCode === 200 && res.data.data) {
                resolve(res.data.data);
                return;
            }
            reject(res);
        }).catch(async err => {
            if (err && err.response && err.response.data && err.response.data.statusCode === 403) {
                this.deauthorize();
            }
            reject(err);
        });
    })

    loop = (data, key, callback) => {
        data.forEach((item, index, arr) => {
            if (item.key === key) {
                callback(item, index, arr);
                return;
            }
            if (item.children) {
                this.loop(item.children, key, callback);
            }
        });
    };

    onSaveFolderHandler = (i18n, folders) => {
        axios.post(`${config.apiURL}/api/pages/folders/save`, {
            token: this.props.appDataRuntime.token,
            folders: folders.tree
        }, { headers: { 'content-type': 'application/json' } }).then(async res => {
            if (res && res.data && res.data.statusCode === 200) {
                return;
            }
            UIkit.notification({
                message: i18n._(t`Could not save data`),
                status: 'danger'
            });
        }).catch(async err => {
            if (err && err.response && err.response.data && err.response.data.statusCode === 403) {
                this.deauthorize();
                return;
            }
            UIkit.notification({
                message: i18n._(t`Could not save data`),
                status: 'danger'
            });
        });
        const path = [];
        if (!folders.selected.length) {
            this.editPagesForm.current.setValue('path', '/');
        } else {
            this.loop(folders.tree, folders.selected[0], item => {
                path.push(item.key);
                let { parent } = item;
                while (parent) {
                    this.loop(folders.tree, parent, sitem => {
                        path.push(sitem.key);
                        parent = sitem.parent;
                    });
                }
            });
            this.editPagesForm.current.setValue('path', `/${path.reverse().join('/')}`);
        }
    }

    onSetPathValButtonClick = async (event, i18n) => {
        event.preventDefault();
        try {
            this.editPagesForm.current.setLoading(true);
            const tree = await this.loadFoldersData();
            this.dialogFolder.current.setTreeValues(tree);
            this.editPagesForm.current.setLoading(false);
            this.dialogFolder.current.show();
        } catch (e) {
            this.editPagesForm.current.setLoading(false);
            UIkit.notification({
                message: i18n._(t`Could not load data from server`),
                status: 'danger'
            });
        }
    }

    getEditForm = i18n => (<FormBuilder
        ref={this.editPagesForm}
        prefix="editPagesForm"
        UIkit={UIkit}
        axios={axios}
        i18n={i18n}
        commonFields={['path']}
        tabs={config.languages}
        data={
            [
                {
                    id: 'path',
                    type: 'val',
                    css: 'uk-form-width-medium',
                    label: `${i18n._(t`Path`)}:`,
                    autofocus: true,
                    onSetValButtonClick: e => this.onSetPathValButtonClick(e, i18n)
                },
                {
                    id: 'title',
                    type: 'text',
                    css: 'uk-form-width-large',
                    label: `${i18n._(t`Title`)}:`
                },
                {
                    id: 'divider1',
                    type: 'divider'
                },
                [
                    {
                        id: 'btnCancel',
                        type: 'button',
                        buttonType: 'link',
                        linkTo: '/admin/pages',
                        css: 'uk-button-default uk-margin-small-right',
                        label: i18n._(t`Cancel`)
                    }, {
                        id: 'btnSave',
                        type: 'button',
                        buttonType: 'submit',
                        css: 'uk-button-primary',
                        label: i18n._(t`Save`)
                    }
                ]
            ]
        }
        validation={
            {
                username: {
                    mandatory: true,
                    regexp: /^[a-zA-Z0-9_-]{4,32}$/
                },
                email: {
                    mandatory: true,
                    // eslint-disable-next-line no-control-regex
                    regexp: /^(?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/
                },
                password: {
                    shouldMatch: 'password2'
                },
                password2: {
                    shouldMatch: 'password'
                }
            }
        }
        lang={{
            ERR_VMANDATORY: t`Field is required`,
            ERR_VFORMAT: t`Invalid format`,
            ERR_VNOMATCH: t`Passwords do not match`,
            ERR_LOAD: t`Could not load data from server`,
            ERR_SAVE: t`Could not save data`,
            WILL_BE_DELETED: t`will be deleted. Are you sure?`,
            YES: t`Yes`,
            CANCEL: t`Cancel`
        }}
        save={{
            url: `${config.apiURL}/api/pages/save`,
            method: 'POST',
            extras: {
                id: this.props.match.params.id,
                token: this.props.appDataRuntime.token
            }
        }}
        load={this.props.match.params.id ? {
            url: `${config.apiURL}/api/pages/load`,
            method: 'POST',
            extras: {
                id: this.props.match.params.id,
                token: this.props.appDataRuntime.token
            }
        } : null}
        onSaveSuccess={() => this.onSaveSuccessHandler(i18n)}
        onLoadError={() => this.setState({ loadingError: true })}
        onLoadSuccess={() => this.setState({ loadingError: false })}
    />);

    reloadEditFormData = e => {
        e.preventDefault();
        this.setState({ loadingError: false });
    }

    render = () => (
        <AdminPanel>
            <I18n>
                {({ i18n }) => {
                    this.props.appDataRuntimeSetDocumentTitleAction(i18n._(this.props.match.params.id ? 'Edit Page' : 'New Page'), this.props.appData.language);
                    return (<>
                        <div className="uk-title-head uk-margin-bottom">{this.props.match.params.id ? <Trans>Edit Page</Trans> : <Trans>New Page</Trans>}</div>
                        {this.state.loadingError ? <div className="uk-alert-danger" uk-alert="true">
                            <Trans>Could not load data from server. Please check your URL or try to <a href="" onClick={this.reloadEditFormData}>reload</a> data.</Trans>
                        </div> : this.getEditForm(i18n)}
                        <DialogFolder
                            ref={this.dialogFolder}
                            i18n={i18n}
                            onSaveButtonClickHandler={folders => this.onSaveFolderHandler(i18n, folders)}
                        />
                    </>);
                }}
            </I18n>
        </AdminPanel>
    );
}

export default connect(store => ({
    appData: store.appData,
    appDataRuntime: store.appDataRuntime,
    appLingui: store.appLingui
}),
    dispatch => ({
        appDataRuntimeSetTokenAction: token => dispatch(appDataRuntimeSetToken(token)),
        appDataSetUserAction: user => dispatch(appDataSetUser(user)),
        appDataRuntimeSetDocumentTitleAction: (documentTitle, language) => dispatch(appDataRuntimeSetDocumentTitle(documentTitle, language))
    }))(PagesEdit);