
import '@hudx/hudx.css';

export default function StyleGuide() {
  return (
    <div style={{padding: '2rem'}}>
      <h1>HUDX Style Guide (POC)</h1>
      <div className="page-row"><h2>Featured Topics</h2>
        <div className="card-group">
          <div className="card"><h3>Card One: Getting Started</h3><p>Vestibulum id ligula porta felis euismod semper.
            Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui.
            Cras justo odio, dapibus ac facilisis in, egestas eget quam. Fusce dapibus, tellus ac cursus commodo, tortor
            mauris condimentum nibh, ut fermentum massa justo sit amet risus.</p></div>
          <div className="card"><h3>Card Two: Key Features</h3><p>Aenean lacinia bibendum nulla sed consectetur. Donec
            ullamcorper nulla non metus auctor fringilla. Maecenas sed diam eget risus varius blandit sit amet non
            magna. Nullam quis risus eget urna mollis ornare vel eu leo. Nulla vitae elit libero, a pharetra augue.
            Integer posuere erat a ante venenatis dapibus posuere velit aliquet.</p></div>
          <div className="card"><h3>Card Three: Next Steps</h3><p>Vivamus sagittis lacus vel augue laoreet rutrum
            faucibus dolor auctor. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio
            sem nec elit. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Praesent commodo cursus magna,
            vel scelerisque nisl consectetur et. Etiam porta sem malesuada magna mollis euismod.</p></div>
        </div>
      </div>
      <button className="hudx-button">HUDX Button</button>
    </div>
  );
}
