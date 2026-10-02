(() => {
  const token=localStorage.getItem('authToken');
  if(!token){window.location.replace('/login.html');return;}
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t=(key,fallback='')=>typeof window.t==='function'?(window.t(key)||fallback):fallback;
  const headers=()=>({Authorization:'Bearer '+localStorage.getItem('authToken')});

  const applyTheme=value=>{
    const theme=['light','dark','system'].includes(value)?value:'system';
    if(typeof window.setTheme==='function'){window.setTheme(theme);return;}
    localStorage.setItem('theme',theme);localStorage.setItem('mohor_theme',theme);
    const dark=theme==='dark'||(theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark',dark);
    document.documentElement.setAttribute('data-theme',dark?'dark':'light');
  };

  const applyLanguage=value=>{
    const lang=value==='bn'?'bn':'en';
    if(typeof window.setLanguage==='function') window.setLanguage(lang);
    else {
      window.currentLang=lang;
      localStorage.setItem('lang',lang);localStorage.setItem('mohor_lang',lang);
      document.documentElement.lang=lang;
      if(window.i18n&&typeof window.i18n.updatePage==='function') window.i18n.updatePage();
      else if(typeof window.updateUIText==='function') window.updateUIText();
    }
    return lang;
  };

  const api=async(path,options={})=>{
    const response=await fetch(path,{...options,headers:{...headers(),...(options.body?{'Content-Type':'application/json'}:{})}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||t('requestFailed','Request failed'));
    return data;
  };

  let profile={};
  let orders=[];
  let notifications=[];

  function message(text,error=false){
    const target=$('accountMessage');
    target.textContent=text;
    target.className=error?'account-message error':'account-message success';
  }

  function setProfile(user){
    profile=user||{};
    $('name').value=profile.name||'';
    $('email').value=profile.email||'';
    $('gender').value=profile.gender||'';
    $('phone').value=profile.phone||'';
    $('dob').value=profile.dob||'';
    $('address').value=profile.address||'';
    $('addressCopy').value=profile.address||'';
    const heading=profile.name||t('myAccountFallback','My Account');
    $('profileHeading').textContent=heading;
    $('avatar').textContent=(heading||profile.email||'M').charAt(0).toUpperCase();
    localStorage.setItem('authUser',JSON.stringify(profile));
  }

  function orderItems(order){return Array.isArray(order.items)?order.items:[];}

  function translateStatus(status){
    const normalized=String(status||'').toLowerCase();
    const map={pending:'pending',processing:'processing',shipped:'shipped',completed:'completed',delivered:'delivered',cancelled:'cancelled'};
    return t(map[normalized]||'',status||t('pending','Pending'));
  }

  function renderOrders(){
    const html=orders.length?orders.map((order,index)=>{
      const items=orderItems(order);
      const date=order.orderDate||order.created_at||order.order_date;
      const locale=window.currentLang==='bn'?'bn-BD':'en-BD';
      const total=Number(order.totalAmount||order.total_amount||0).toLocaleString(locale);
      const status=String(order.status||'Pending');
      const count=items.reduce((sum,item)=>sum+Number(item.qty||item.quantity||1),0);
      return '<article class="account-order-card">'+
        '<div class="account-order-row"><strong>'+esc(order.id||order.order_id)+'</strong>'+
        '<span class="account-status '+esc(status.toLowerCase())+'">'+esc(translateStatus(status))+'</span></div>'+
        '<small>'+esc(date?new Date(date).toLocaleDateString(locale):'')+' · '+
        esc(t('itemsCount','{count} item(s)').replace('{count}',count))+'</small>'+
        '<b>৳'+esc(total)+'</b>'+
        '<button type="button" class="account-btn account-btn-outline account-details" data-order="'+index+'">'+
        esc(t('viewDetails','View Details'))+'</button></article>';
    }).join(''):'<p class="account-muted">'+esc(t('noOrdersYet','No orders yet.'))+'</p>';
    $('orders').innerHTML=html;
  }

  function renderModal(order){
    const items=orderItems(order);
    const title=esc(t('order','Order'))+' '+esc(order.id||order.order_id);
    const lines=items.map(item=>{
      let suffix='';
      if(item.size) suffix+=' · '+esc(t('size','Size'))+' '+esc(item.size);
      if(item.color) suffix+=' · '+esc(item.color);
      return '<li>'+esc(item.name||item.title||t('order','Item'))+' × '+esc(item.qty||item.quantity||1)+suffix+'</li>';
    }).join('');
    const locale=window.currentLang==='bn'?'bn-BD':'en-BD';
    $('modalContent').innerHTML=
      '<h2 id="modalTitle">'+title+'</h2>'+
      '<p><strong>'+esc(t('status','Status'))+':</strong> '+esc(translateStatus(order.status||'Pending'))+'</p>'+
      '<ul>'+lines+'</ul>'+
      '<p><strong>'+esc(t('shippingAddress','Shipping address'))+':</strong><br>'+esc(order.deliveryAddress||order.delivery_address||'')+'</p>'+
      '<p><strong>'+esc(t('total','Total'))+':</strong> ৳'+esc(Number(order.totalAmount||order.total_amount||0).toLocaleString(locale))+'</p>';
    $('orderModal').hidden=false;
    $('closeModal').focus();
  }

  function renderNotifications(){
    const unread=notifications.filter(item=>!Number(item.is_read)).length;
    const badge=$('notificationBadge');
    if(badge){badge.textContent=unread;badge.hidden=unread===0;}
    $('notifications').innerHTML=notifications.length?notifications.map(item=>
      '<article class="notification-card '+(Number(item.is_read)?'':'unread')+'">'+
      '<span class="notification-icon" aria-hidden="true">'+(item.type==='order'?'📦':item.type==='promo'?'✦':'◌')+'</span>'+
      '<div><strong>'+esc(item.title)+'</strong><p>'+esc(item.message)+'</p>'+
      '<small>'+esc(new Date(item.created_at).toLocaleString(window.currentLang==='bn'?'bn-BD':'en-BD'))+'</small></div>'+
      (item.link?'<a class="account-btn account-btn-outline" href="'+esc(item.link)+'">'+esc(t('view','View'))+'</a>':'')+
      '</article>'
    ).join(''):'<p class="account-muted">'+esc(t('noMessagesYet','No messages yet.'))+'</p>';
  }

  async function loadNotifications(){
    try{
      const data=await api('/api/notifications');
      notifications=Array.isArray(data.notifications)?data.notifications:[];
      renderNotifications();
    }catch(error){
      notifications=[];
      $('notifications').innerHTML='<p class="account-muted">'+esc(t('errorLoadingMessages','Unable to load messages right now.'))+'</p>';
    }
  }

  function openDeleteModal(){ $('deleteModal').hidden=false; $('cancelDeleteModal').focus(); }
  function closeDeleteModal(){ $('deleteModal').hidden=true; }

  async function deleteAccount(){
    const button=$('confirmDeleteModal');
    button.disabled=true;
    try{
      await api('/api/auth/delete-account',{method:'DELETE'});
      localStorage.removeItem('authToken');localStorage.removeItem('authUser');
      window.location.href='/login.html';
    }catch(error){
      button.disabled=false;closeDeleteModal();message(error.message,true);
    }
  }

  async function load(){
    try{
      const results=await Promise.all([api('/api/auth/me'),api('/api/orders')]);
      setProfile(results[0].user||results[0]);
      const orderData=results[1];
      orders=Array.isArray(orderData)?orderData:(orderData.orders||[]);
      renderOrders();
      await loadNotifications();
    }catch(error){message(error.message,true);}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-tab], .account-hub .account-panel').forEach(el=>el.classList.remove('active'));
      button.classList.add('active');
      const panel=document.querySelector(button.dataset.tab);
      if(panel) panel.classList.add('active');
    }));

    $('profileForm').addEventListener('submit',async event=>{
      event.preventDefault();
      if(!$('name').value.trim()){
        message(window.currentLang==='bn'?'পুরো নাম দেওয়া আবশ্যক।':'Full Name is required.',true);
        return;
      }
      try{
        const data=await api('/api/auth/me',{
          method:'PUT',
          body:JSON.stringify({
            name:$('name').value.trim(),
            phone:$('phone').value.trim(),
            gender:$('gender').value,
            dob:$('dob').value,
            address:$('address').value.trim()
          })
        });
        setProfile(data.user||data);
        message(t('profileSaved','Profile saved successfully.'));
      }catch(error){message(error.message,true);}
    });

    $('saveAddress').addEventListener('click',()=>{
      $('address').value=$('addressCopy').value;
      $('profileForm').requestSubmit();
    });

    $('passwordForm').addEventListener('submit',async event=>{
      event.preventDefault();
      if($('newPassword').value!==$('confirmPassword').value){
        message(t('passwordsDoNotMatch','Passwords do not match.'),true);
        return;
      }
      try{
        await api('/api/auth/change-password',{
          method:'POST',
          body:JSON.stringify({
            currentPassword:$('currentPassword').value,
            newPassword:$('newPassword').value
          })
        });
        event.target.reset();
        message(t('passwordChanged','Password changed successfully.'));
      }catch(error){message(error.message,true);}
    });

    $('deleteAccount').addEventListener('click',openDeleteModal);
    $('cancelDeleteModal').addEventListener('click',closeDeleteModal);
    $('confirmDeleteModal').addEventListener('click',deleteAccount);

    document.querySelectorAll('.account-modal').forEach(modal=>modal.addEventListener('click',event=>{
      if(event.target===modal) modal.hidden=true;
    }));

    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        $('orderModal').hidden=true;
        closeDeleteModal();
      }
    });

    $('logout').addEventListener('click',()=>{
      localStorage.removeItem('authToken');localStorage.removeItem('authUser');
      window.location.href='/login.html';
    });

    $('orders').addEventListener('click',event=>{
      const button=event.target.closest('.account-details');
      if(button) renderModal(orders[button.dataset.order]);
    });

    $('closeModal').addEventListener('click',()=>{$('orderModal').hidden=true;});

    const theme=localStorage.getItem('theme')||localStorage.getItem('mohor_theme')||localStorage.getItem('mohorTheme')||'system';
    $('theme').value=['light','dark','system'].includes(theme)?theme:'system';
    $('theme').addEventListener('change',event=>applyTheme(event.target.value));
    applyTheme($('theme').value);

    const language=localStorage.getItem('lang')||localStorage.getItem('mohor_lang')||'en';
    $('language').value=language==='bn'?'bn':'en';
    $('language').addEventListener('change',event=>applyLanguage(event.target.value));

    window.addEventListener('languageChanged',()=>{renderOrders();renderNotifications();});
    applyLanguage($('language').value);

    $('markAllNotifications').addEventListener('click',async()=>{
      try{
        await api('/api/notifications/mark-read',{method:'POST',body:JSON.stringify({markAll:true})});
        notifications.forEach(item=>{item.is_read=1;});
        renderNotifications();
        message(t('notificationsMarkedRead','All notifications marked as read.'));
      }catch(error){message(error.message,true);}
    });

    load();
  });
})();