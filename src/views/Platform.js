import axios from 'axios'
import React from 'react'
import config from '../config'
import Table from 'rc-table'
import ErrorHandler from '../components/ErrorHandler'
import EditButton from '../components/EditButton'
import FormFieldRow from '../components/FormFieldRow'
import FormFieldSelectRow from '../components/FormFieldSelectRow'
import { Accordion, Button, Card, Modal } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import FormFieldWideRow from '../components/FormFieldWideRow'
import TooltipTrigger from '../components/TooltipTrigger'
import SocialShareIcons from '../components/SocialShareIcons'

const defaultRegex = /.+/
const nameRegex = /.{1,}/
const intRegex = /^([+-]?[1-9]\d*|0)$/
const numberRegex = /^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/
// bool is handled by checkbox FormFieldRow
// datetime is handled by date/time picker FormFieldRow
// date is handled by date-only picker FormFieldRow

library.add(faEdit)

class Platform extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isRequestFailed: false,
      requestFailedMessage: '',
      showAddModal: false,
      showRemoveModal: false,
      showEditModal: false,
      showAccordion: false,
      isValidated: false,
      modalMode: '',
      modalEditMode: '',
      platform: { description: '', parentPlatform: 0 },
      item: {
        id: 0,
        description: '',
        parentPlatform: null,
        properties: []
      },
      allPlatformNames: [],
      allPropertyNames: [],
      allDataTypeNames: [],
      propertyNames: [],
      parentProperties: [],
      property: {
        id: 0,
        name: '',
        fullName: '',
        dataTypeId: 1,
        typeFriendlyName: 'bool',
        typeDescription: '',
        value: '',
        inputType: 'checkbox',
        inputRegex: defaultRegex,
        valueDescription: '',
        platformId: this.props.match.params.id
      }
    }

    this.handleAccordionToggle = this.handleAccordionToggle.bind(this)
    this.handleShowEditModal = this.handleShowEditModal.bind(this)
    this.handleHideEditModal = this.handleHideEditModal.bind(this)
    this.handleEditModalDone = this.handleEditModalDone.bind(this)
    this.handleAddModalSubmit = this.handleAddModalSubmit.bind(this)
    this.handleOnChange = this.handleOnChange.bind(this)
    this.handleOnChangePropertyId = this.handleOnChangePropertyId.bind(this)
    this.handleOnClickAdd = this.handleOnClickAdd.bind(this)
    this.handleOnClickAddProperty = this.handleOnClickAddProperty.bind(this)
    this.handleOnClickRemove = this.handleOnClickRemove.bind(this)
    this.handleHideAddModal = this.handleHideAddModal.bind(this)
    this.handleRemoveModalDone = this.handleRemoveModalDone.bind(this)
    this.handleOnTypeChange = this.handleOnTypeChange.bind(this)
    this.handleOnClickEditProperty = this.handleOnClickEditProperty.bind(this)
    this.handleCombineParentProperties = this.handleCombineParentProperties.bind(this)
    this.handleOnPropertyRemove = this.handleOnPropertyRemove.bind(this)
  }

  handleAccordionToggle () {
    this.setState({ showAccordion: !this.state.showAccordion, isValidated: false })
  }

  handleShowEditModal () {
    let mode = 'Property'
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    }
    const platform = {
      properties: this.state.item.properties,
      description: this.state.item.description,
      parentPlatform: this.state.item.parentPlatform
    }
    this.setState({ showEditModal: true, modalMode: mode, modalEditMode: 'Edit', platform: platform })
  }

  handleHideEditModal () {
    this.setState({ showEditModal: false })
  }

  handleEditModalDone () {
    if (!this.props.isLoggedIn) {
      window.location.href = '/Login'
    }

    const reqBody = {
      description: this.state.platform.description,
      parentPlatform: this.state.platform.parentPlatform
    }

    axios.post(config.api.getUriPrefix() + '/platform/' + this.props.match.params.id, reqBody)
      .then(res => {
        this.setState({ item: res.data.data, showEditModal: false })
      })
      .catch(err => {
        window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
      })
  }

  handleAddModalSubmit () {
    if (!this.props.isLoggedIn) {
      window.location.href = '/Login'
    }

    const property = {
      id: this.state.showAccordion ? undefined : this.state.property.id,
      name: this.state.property.name,
      fullName: this.state.property.fullName,
      value: this.state.property.value,
      dataTypeId: this.state.property.dataTypeId
    }
    if (!property.name) {
      window.alert('Error: Property name cannot be blank.')
      return
    }
    if (!property.dataTypeId) {
      window.alert('Error: Property type cannot be null.')
      return
    }
    if (!property.value) {
      if (property.dataTypeId === 1) {
        property.value = false
      } else {
        window.alert('Error: Property value cannot be blank.')
        return
      }
    }
    if (!property.fullName) {
      property.fullName = property.name
    }

    const propertyRoute = config.api.getUriPrefix() + '/platform/' + this.state.item.id + '/property'
    axios.post(propertyRoute, property)
      .then(res => {
        window.location.reload()
      })
      .catch(err => {
        window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
      })
  }

  handleRemoveModalDone () {
    this.setState({ showRemoveModal: false })
  }

  handleOnChange (key1, key2, value) {
    if (!value && value !== false) {
      value = null
    }
    if (key1) {
      const k1 = this.state[key1]
      k1[key2] = value
      this.setState({ [key1]: k1 })
    } else {
      this.setState({ [key2]: value })
    }
  }

  handleOnChangePropertyId (value) {
    const property = this.state.property
    property.id = parseInt(value)
    for (let i = 0; i < this.state.allPropertyNames.length; i++) {
      const propName = this.state.allPropertyNames[i]
      if (property.id === propName.id) {
        this.handleOnTypeChange(propName.dataTypeId, propName.id, propName.name, propName.fullName)
        break
      }
    }
  }

  handleOnTypeChange (dataTypeId, id, name, fullName, value) {
    const friendlyType = this.state.allDataTypeNames ? this.state.allDataTypeNames.find(x => x.id === dataTypeId).friendlyType : 'bool'

    let inputType = 'textarea'
    let inputRegex = defaultRegex
    if (friendlyType === 'bool') {
      inputType = 'checkbox'
      inputRegex = undefined
    } else if (friendlyType === 'date') {
      inputType = 'date'
      inputRegex = undefined
    } else if (friendlyType === 'datetime') {
      inputType = 'datetime-local'
      inputRegex = undefined
    }
    if (friendlyType === 'int') {
      inputType = 'number'
      inputRegex = intRegex
    } else if (friendlyType === 'number') {
      inputType = 'number'
      inputRegex = numberRegex
    }

    const property = this.state.property
    property.dataTypeId = dataTypeId
    property.typeFriendlyName = friendlyType
    property.inputType = inputType
    property.inputRegex = inputRegex
    property.id = id === undefined ? 0 : id
    property.name = name === undefined ? this.state.property.name : name
    property.fullName = fullName === undefined ? property.name : fullName
    property.value = value === undefined ? this.state.property.value : value

    this.setState({ property: property })
  }

  handleOnClickAddProperty () {
    if (this.state.allPropertyNames.length) {
      const property = this.state.allPropertyNames[0]
      this.handleOnTypeChange(property.dataTypeId, property.id, property.name, property.fullName)
    } else {
      this.handleOnTypeChange(1)
    }
    this.handleOnClickAdd('Property')
  }

  handleOnClickAdd (mode) {
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    }
    this.handleOnChangePropertyId(this.state.allPlatformNames.length ? this.state.allPlatformNames[0].id : 0)
    this.setState({ showAddModal: true, showAccordion: false, modalMode: mode, modalEditMode: 'Add', isValidated: false })
  }

  handleHideAddModal () {
    this.setState({ showAddModal: false, showAccordion: false })
  }

  handleOnClickRemove (mode) {
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    }
    this.setState({ showRemoveModal: true, modalMode: mode, modalEditMode: 'Remove' })
  }

  handleOnPropertyRemove (propertyId) {
    if (!window.confirm('Are you sure you want to remove this property from the submission?')) {
      return
    }
    if (this.props.isLoggedIn) {
      axios.delete(config.api.getUriPrefix() + '/property/' + propertyId)
        .then(res => {
          const platform = res.data.data
          this.setState({ isRequestFailed: false, requestFailedMessage: '', item: platform })
          this.handleCombineParentProperties(platform)
        })
        .catch(err => {
          window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
        })
    } else {
      window.location.href = '/Login'
    }
  }

  handleOnClickEditProperty (propertyId) {
    for (let i = 0; i < this.state.item.properties.length; i++) {
      if (this.state.item.properties[i].id === propertyId) {
        const property = this.state.item.properties[i]
        property.submissionId = this.state.item.id
        this.handleOnTypeChange(property.dataTypeId, propertyId, property.name, property.fullName, property.value)
        break
      }
    }
    this.handleOnClickAdd('property')
  }

  handleCombineParentProperties (platform) {
    const parentProperties = []
    while (platform.parentPlatform) {
      const properties = platform.parentPlatform.properties
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i]
        property.key = property.id
        property.type = property.typeFriendlyName
        property.platform = platform.parentPlatform.name
        parentProperties.push(property)
      }
      platform = platform.parentPlatform
    }

    this.setState({ parentProperties })
  }

  componentDidMount () {
    const platformRoute = config.api.getUriPrefix() + '/platform/' + this.props.match.params.id
    axios.get(platformRoute)
      .then(res => {
        const platform = res.data.data
        this.setState({ isRequestFailed: false, requestFailedMessage: '', item: platform })
        this.handleCombineParentProperties(platform)

        const propertyRoute = config.api.getUriPrefix() + '/property/names'
        axios.get(propertyRoute)
          .then(res => {
            this.setState({ isRequestFailed: false, requestFailedMessage: '', allPropertyNames: res.data.data })

            const platformsRoute = config.api.getUriPrefix() + '/platform/names'
            axios.get(platformsRoute)
              .then(res => {
                const platforms = [{ id: 0, name: '(None)' }, ...res.data.data]
                for (let i = 0; i < platforms.length; i++) {
                  if (platforms[i].id === platform.id) {
                    platforms.splice(i, 1)
                    break
                  }
                }
                this.setState({ isRequestFailed: false, requestFailedMessage: '', allPlatformNames: platforms })

                const dataTypeNamesRoute = config.api.getUriPrefix() + '/dataType/names'
                axios.get(dataTypeNamesRoute)
                  .then(res => {
                    this.setState({ isRequestFailed: false, requestFailedMessage: '', allDataTypeNames: res.data.data })
                  })
                  .catch(err => {
                    this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
                  })
              })
              .catch(err => {
                this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
              })
          })
          .catch(err => {
            this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
          })
      })
      .catch(err => {
        this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
      })
  }

  render () {
    return (
      <div id='metriq-main-content'>
        <div className='container submission-detail-container'>
          <FormFieldWideRow>
            <div><h1>{this.state.item.fullName ? this.state.item.fullName : this.state.item.name}</h1></div>
            <div className='submission-description'>
              {this.state.item.description ? this.state.item.description : <i>No description provided.</i>}
            </div>
          </FormFieldWideRow>
          <FormFieldWideRow>
            <TooltipTrigger message='Edit description'>
              <button className='submission-button btn btn-secondary' onClick={this.handleShowEditModal}><FontAwesomeIcon icon='edit' /></button>
            </TooltipTrigger>
            <SocialShareIcons url={config.api.getUriPrefix() + '/platform/' + this.props.match.params.id} />
          </FormFieldWideRow>
          <br />
          {(this.state.item.childPlatforms && (this.state.item.childPlatforms.length > 0)) &&
            <div>
              <h2>Child Platforms</h2>
              <div className='row'>
                <div className='col-md-12'>
                  <Table
                    className='detail-table'
                    columns={[{
                      title: 'Name',
                      dataIndex: 'name',
                      key: 'name',
                      width: 700
                    }]}
                    data={this.state.item.childPlatforms
                      ? this.state.item.childPlatforms.map(row => ({
                          key: row.id,
                          name: row.name
                        }))
                      : []}
                    onRow={(record) => ({
                      onClick () { window.location.href = '/Platform/' + record.key }
                    })}
                    tableLayout='auto'
                    rowClassName='link'
                  />
                </div>
              </div>
              <br />
            </div>}
          {this.state.item.parentPlatform &&
            <div className='row'>
              <div className='col-md-12'>
                <div className='submission-description'>
                  <b>Parent platform:</b> <Link to={'/Platform/' + this.state.item.parentPlatform.id}>{this.state.item.parentPlatform.name}</Link>
                </div>
              </div>
              <br />
            </div>}
          {(this.state.parentProperties.length > 0) &&
            <div>
              <h2>Parent Properties</h2>
              <div className='row'>
                <div className='col-md-12'>
                  <Table
                    className='detail-table'
                    columns={[{
                      title: 'Name',
                      dataIndex: 'name',
                      key: 'name',
                      width: 300
                    },
                    {
                      title: 'Type',
                      dataIndex: 'type',
                      key: 'type',
                      width: 300
                    },
                    {
                      title: 'Value',
                      dataIndex: 'value',
                      key: 'value',
                      width: 300
                    },
                    {
                      title: 'Platform',
                      dataIndex: 'platform',
                      key: 'platform',
                      width: 300
                    }]}
                    data={this.state.parentProperties}
                    onRow={(record) => ({
                      onClick () { window.location.href = '/Platform/' + record.key }
                    })}
                    tableLayout='auto'
                    rowClassName='link'
                  />
                </div>
              </div>
              <br />
            </div>}
          <h2>Submissions</h2>
          <div className='row'>
            <div className='col-md-12'>
              <Table
                className='detail-table'
                columns={[{
                  title: 'Name',
                  dataIndex: 'name',
                  key: 'name',
                  width: 700
                },
                {
                  title: 'Submitted',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  width: 200
                },
                {
                  title: 'Up-votes',
                  dataIndex: 'upvoteCount',
                  key: 'upvoteCount',
                  width: 200
                }]}
                data={this.state.item.submissions
                  ? this.state.item.submissions.map(row => ({
                      key: row.id,
                      name: row.name,
                      createdAt: new Date(row.createdAt).toLocaleDateString('en-US'),
                      upvoteCount: row.upvoteCount || 0
                    }))
                  : []}
                onRow={(record) => ({
                  onClick () { window.location.href = '/Submission/' + record.key }
                })}
                tableLayout='auto'
                rowClassName='link'
              />
            </div>
          </div>
          <br />
          <FormFieldWideRow>
            <div>
              <h2>Properties
                <EditButton
                  className='float-right edit-button btn'
                  onClickAdd={() => this.handleOnClickAddProperty()}
                  onClickRemove={() => this.handleOnClickRemove('Property')}
                />
              </h2>
              <hr />
            </div>
            {(this.state.item.properties.length > 0) &&
              <Table
                columns={[
                  {
                    title: 'Name',
                    dataIndex: 'name',
                    key: 'name',
                    width: 386
                  },
                  {
                    title: 'Type',
                    dataIndex: 'type',
                    key: 'type',
                    width: 386
                  },
                  {
                    title: 'Value',
                    dataIndex: 'value',
                    key: 'value',
                    width: 386
                  },
                  {
                    title: '',
                    dataIndex: 'edit',
                    key: 'edit',
                    width: 42,
                    render: (value, row, index) => <div className='text-center'><FontAwesomeIcon icon='edit' onClick={() => this.handleOnClickEditProperty(row.key)} /></div>
                  }
                ]}
                data={this.state.item.properties.length
                  ? this.state.item.properties.map(row =>
                      ({
                        key: row.id,
                        name: row.name,
                        type: row.typeFriendlyName,
                        value: row.value
                      }))
                  : []}
                tableLayout='auto'
              />}
            {(this.state.item.properties.length === 0) &&
              <div className='card bg-light'>
                <div className='card-body'>There are no associated properties, yet.</div>
              </div>}
          </FormFieldWideRow>
        </div>
        <Modal
          show={this.state.showEditModal}
          onHide={this.handleHideEditModal}
          size='lg'
          aria-labelledby='contained-modal-title-vcenter'
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Platform</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {(this.state.modalMode === 'Login') &&
              <span>
                Please <Link to='/Login'>login</Link> before editing.
              </span>}
            {(this.state.modalMode !== 'Login') &&
              <span>
                <FormFieldSelectRow
                  inputName='parentPlatform'
                  label='Parent platform<br/>(if any)'
                  options={this.state.allPlatformNames}
                  value={this.state.platform.parentPlatform}
                  onChange={(field, value) => this.handleOnChange('platform', field, value)}
                  tooltip='Optionally, the new platform is a sub-platform of a "parent" platform.'
                /><br />
                <FormFieldRow
                  inputName='description' inputType='textarea' label='Description' rows='12'
                  value={this.state.platform.description}
                  onChange={(field, value) => this.handleOnChange('platform', field, value)}
                />
              </span>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant='primary' onClick={this.handleEditModalDone}>
              {(this.state.modalMode === 'Login') ? 'Cancel' : 'Done'}
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={this.state.showAddModal}
          onHide={this.handleHideAddModal}
          size='lg'
          aria-labelledby='contained-modal-title-vcenter'
          centered
        >
          <Modal.Header closeButton>
            {(this.state.modalMode === 'Login') &&
              <Modal.Title>Add Property</Modal.Title>}
            {(this.state.modalMode !== 'Login') &&
              <Modal.Title>{this.state.modalEditMode} {this.state.modalMode}</Modal.Title>}
          </Modal.Header>
          <Modal.Body>
            {(this.state.modalMode === 'Login') &&
              <span>
                Please <Link to='/Login'>login</Link> before editing.
              </span>}
            {(this.state.modalMode !== 'Login') &&
              <span>
                <FormFieldSelectRow
                  inputName='id'
                  label='Property'
                  options={this.state.allPropertyNames}
                  value={this.state.property.id}
                  onChange={(field, value) => this.handleOnChangePropertyId(value)}
                  tooltip='An explicitly-typed key/value property of this platform'
                  disabled={this.state.showAccordion}
                /><br />
                <FormFieldRow
                  inputName='value'
                  inputType={this.state.property.inputType}
                  label='Value'
                  validRegex={this.state.property.inputRegex}
                  value={this.state.property.value}
                  checked={this.state.property.inputType === 'checkbox' ? this.state.property.value === 'true' : undefined}
                  onChange={(field, value) => this.handleOnChange('property', field, (this.state.property.inputType === 'checkbox') ? value.toString() : value)}
                  tooltip='Platform value of selected property'
                />
                {(this.state.modalEditMode === 'Add') &&
                  <span>
                    <br />Not in the list?<br />
                    <Accordion defaultActiveKey='0'>
                      <Card>
                        <Card.Header>
                          <Accordion.Toggle as={Button} variant='link' eventKey='1' onClick={this.handleAccordionToggle}>
                            <FontAwesomeIcon icon='plus' /> Create a new property.
                          </Accordion.Toggle>
                        </Card.Header>
                        <Accordion.Collapse eventKey='1'>
                          <Card.Body>
                            <FormFieldRow
                              inputName='name'
                              inputType='text'
                              label='Name'
                              onChange={(field, value) => this.handleOnChange('property', field, value)}
                              validRegex={nameRegex}
                              tooltip='Short name of new property'
                            /><br />
                            <FormFieldRow
                              inputName='fullName'
                              inputType='text'
                              label='Full name (optional)'
                              onChange={(field, value) => this.handleOnChange('property', field, value)}
                              tooltip='Long name of new property'
                            /><br />
                            <FormFieldSelectRow
                              inputName='dataTypeId'
                              label='Type'
                              options={this.state.allDataTypeNames}
                              value={this.state.property.dataTypeId}
                              onChange={(field, value) => this.handleOnTypeChange(parseInt(value))}
                              tooltip='Explicit data type of new property'
                            /><br />
                            <FormFieldRow
                              inputName='value'
                              inputType={this.state.property.inputType}
                              label='Value'
                              onChange={(field, value) => this.handleOnChange('property', field, value)}
                              validRegex={this.state.property.inputRegex}
                              tooltip='Value of new property'
                            /><br />
                            <FormFieldRow
                              inputName='typeDescription'
                              inputType='textarea'
                              label='Type Description<br/>(optional)'
                              onChange={(field, value) => this.handleOnChange('property', field, value)}
                              tooltip='Long description of new property type'
                            /><br />
                            <FormFieldRow
                              inputName='valueDescription'
                              inputType='textarea'
                              label='Value Description<br/>(optional)'
                              onChange={(field, value) => this.handleOnChange('property', field, value)}
                              tooltip='Long description of new property value'
                            />
                          </Card.Body>
                        </Accordion.Collapse>
                      </Card>
                    </Accordion>
                  </span>}
              </span>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant='primary' onClick={this.handleAddModalSubmit}>
              {(this.state.modalMode === 'Login') ? 'Cancel' : 'Done'}
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal show={this.state.showRemoveModal} onHide={this.handleHideRemoveModal}>
          <Modal.Header closeButton>
            <Modal.Title>Remove</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {(this.state.modalMode === 'Login') &&
              <span>
                Please <Link to='/Login'>login</Link> before editing.
              </span>}
            {(this.state.modalMode !== 'Login') &&
              <span>
                <b>Attached properties:</b><br />
                {(this.state.item.properties.length > 0) &&
                  this.state.item.properties.map(property =>
                    <div key={property.id}>
                      <hr />
                      <div className='row'>
                        <div className='col-md-10'>
                          {property.name}
                        </div>
                        <div className='col-md-2'>
                          <button className='btn btn-danger' onClick={() => this.handleOnPropertyRemove(property.id)}><FontAwesomeIcon icon='trash' /> </button>
                        </div>
                      </div>
                    </div>
                  )}
                {(this.state.item.properties.length === 0) &&
                  <span><i>There are no attached properties.</i></span>}
              </span>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant='primary' onClick={this.handleRemoveModalDone}>
              {(this.state.modalMode === 'Login') ? 'Cancel' : 'Done'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

export default Platform
