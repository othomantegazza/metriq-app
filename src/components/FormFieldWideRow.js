const FormFieldWideRow = (props) => {
  return (
    <div className='row'>
      <div className={'col-md-12 ' + props.className}>
        {props.children}
      </div>
    </div>
  )
}

export default FormFieldWideRow
